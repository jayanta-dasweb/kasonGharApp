import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BookMarked, Receipt, Send } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { SegmentStrip } from '@/components/ui/SegmentStrip';
import { Toast } from '@/components/ui/Toast';
import { colors } from '@/constants/theme';
import { formatINR } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import { listAccounts, listExpenseHeads, listJournals } from '@/services/masters';
import {
  listAccountMoves,
  listMoveLines,
  postExpenseEntry,
  voidAccountMove,
} from '@/services/accounts';

type Mode = 'ledger' | 'expense';

export default function AccountsScreen() {
  const { profile } = useAuth();
  const [mode, setMode] = useState<Mode>('ledger');
  const [moves, setMoves] = useState<any[]>([]);
  const [linesByMove, setLinesByMove] = useState<Record<string, any[]>>({});
  const [accounts, setAccounts] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [heads, setHeads] = useState<any[]>([]);
  const [debitId, setDebitId] = useState('');
  const [creditId, setCreditId] = useState('');
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [ref, setRef] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [m, a, j, h] = await Promise.all([
        listAccountMoves(),
        listAccounts(),
        listJournals(),
        listExpenseHeads().catch(() => []),
      ]);
      setMoves(m);
      setAccounts(a.filter((x: any) => x.is_active !== false));
      setJournals(j);
      setHeads(h.filter((x: any) => x.is_active !== false));
      if (a[0]) setDebitId(String(a[0].id ?? a[0].account_id));
      if (a[1]) setCreditId(String(a[1].id ?? a[1].account_id));
      else if (a[0]) setCreditId(String(a[0].id ?? a[0].account_id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Accounts load failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const toggleLines = async (moveId: string | number) => {
    const key = String(moveId);
    if (expanded === key) {
      setExpanded(null);
      return;
    }
    setExpanded(key);
    if (!linesByMove[key]) {
      try {
        const lines = await listMoveLines(moveId);
        setLinesByMove((prev) => ({ ...prev, [key]: lines }));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lines load failed');
      }
    }
  };

  return (
    <Screen title="Accounts Ledger" loading={loading} safeTop={false}>
      <Toast message={error} />
      <Toast message={ok} type="success" />

      <View className="mb-3 rounded-2xl bg-white p-4">
        <Text className="text-sm font-semibold text-maroon">Double-entry control</Text>
        <Text className="mt-1 text-xs text-slate-500">
          {journals.length} journals · {accounts.length} active accounts · {moves.length} moves
        </Text>
      </View>

      <SegmentStrip
        value={mode}
        onChange={setMode}
        equal
        items={[
          { key: 'ledger', label: 'Ledger', icon: BookMarked },
          { key: 'expense', label: 'Post expense', icon: Receipt },
        ]}
      />

      {mode === 'expense' ? (
        <View className="rounded-2xl bg-white p-4">
          {heads.length > 0 ? (
            <>
              <Text className="mb-2 text-sm font-medium text-slate-600">Expense head</Text>
              {heads.map((h) => (
                <Pressable
                  key={String(h.id)}
                  className="mb-1 py-2"
                  onPress={() => setNarration(h.name ?? h.head_name ?? '')}
                >
                  <Text className="text-ink">○ {h.name ?? h.head_name}</Text>
                </Pressable>
              ))}
            </>
          ) : null}

          <Text className="mb-2 text-sm font-medium text-slate-600">Debit account</Text>
          {accounts.map((a) => {
            const id = String(a.id ?? a.account_id);
            return (
              <Pressable key={`d-${id}`} onPress={() => setDebitId(id)} className="mb-1 py-1">
                <Text style={{ color: debitId === id ? colors.maroon : colors.ink }}>
                  {debitId === id ? '● ' : '○ '}
                  {a.code} · {a.name} ({a.account_type})
                </Text>
              </Pressable>
            );
          })}

          <Text className="mb-2 mt-2 text-sm font-medium text-slate-600">Credit account</Text>
          {accounts.map((a) => {
            const id = String(a.id ?? a.account_id);
            return (
              <Pressable key={`c-${id}`} onPress={() => setCreditId(id)} className="mb-1 py-1">
                <Text style={{ color: creditId === id ? colors.maroon : colors.ink }}>
                  {creditId === id ? '● ' : '○ '}
                  {a.code} · {a.name} ({a.account_type})
                </Text>
              </Pressable>
            );
          })}

          <Input label="Narration" value={narration} onChangeText={setNarration} />
          <Input label="Reference" value={ref} onChangeText={setRef} />
          <Input
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          <Button
            icon={Send}
            label="Post expense entry"
            loading={saving}
            onPress={async () => {
              setSaving(true);
              setError(null);
              setOk(null);
              try {
                if (!narration.trim()) throw new Error('Narration required');
                await postExpenseEntry({
                  debit_account_id: debitId,
                  credit_account_id: creditId,
                  amount: Number(amount),
                  name: narration,
                  ref: ref || null,
                  created_by: profile?.user_id,
                });
                setOk('Expense posted to ledger');
                setAmount('');
                setNarration('');
                setRef('');
                await load();
                setMode('ledger');
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Post failed');
              } finally {
                setSaving(false);
              }
            }}
          />
        </View>
      ) : (
        <View>
          {moves.length === 0 ? (
            <Text className="text-slate-500">
              No account moves yet. Purchases post IN_BILL and sales post OUT_INVOICE when CoA
              accounts exist.
            </Text>
          ) : (
            moves.map((m, idx) => {
              const id = m.move_id ?? m.id ?? idx;
              const key = String(id);
              const open = expanded === key;
              const cancelled = String(m.state ?? '').toUpperCase().includes('CANCEL');
              return (
                <View key={key} className="mb-2 rounded-xl bg-white p-3">
                  <Pressable onPress={() => toggleLines(id)}>
                    <Text className="font-semibold text-ink">
                      {m.move_type ?? 'MOVE'} · {m.name}
                    </Text>
                    <Text className="text-xs text-slate-500">
                      {m.date} · {m.ref ?? '—'} · {m.state ?? 'POSTED'}
                    </Text>
                  </Pressable>
                  {open ? (
                    <View className="mt-2 border-t border-slate-100 pt-2">
                      {(linesByMove[key] ?? []).map((l, i) => (
                        <Text key={i} className="text-xs text-slate-600">
                          {l.name}: Dr {formatINR(l.debit ?? 0)} / Cr{' '}
                          {formatINR(l.credit ?? 0)}
                        </Text>
                      ))}
                      {!cancelled ? (
                        <Pressable
                          className="mt-2 self-start rounded-lg bg-red-50 px-3 py-2"
                          onPress={async () => {
                            try {
                              await voidAccountMove(id);
                              setOk('Move cancelled');
                              await load();
                            } catch (e) {
                              setError(e instanceof Error ? e.message : 'Cancel failed');
                            }
                          }}
                        >
                          <Text className="text-xs font-bold text-red-700">Cancel / void</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </View>
      )}
    </Screen>
  );
}
