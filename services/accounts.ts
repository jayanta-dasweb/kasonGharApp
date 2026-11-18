import { todayISO } from '@/lib/format';
import { supabase } from '@/lib/supabase';

async function findAccountByType(prefer: string[]) {
  const { data, error } = await supabase
    .from('account_accounts')
    .select('*')
    .eq('is_active', true);
  if (error) throw error;
  const rows = data ?? [];
  for (const key of prefer) {
    const hit = rows.find(
      (r: any) =>
        String(r.account_type ?? '').toLowerCase().includes(key) ||
        String(r.code ?? '').toLowerCase().includes(key) ||
        String(r.name ?? '').toLowerCase().includes(key)
    );
    if (hit) return hit;
  }
  return rows[0] ?? null;
}

async function findJournal(prefer: string[]) {
  const { data, error } = await supabase.from('account_journals').select('*');
  if (error) throw error;
  const rows = data ?? [];
  for (const key of prefer) {
    const hit = rows.find(
      (r: any) =>
        String(r.type ?? r.journal_type ?? '').toLowerCase().includes(key) ||
        String(r.code ?? '').toLowerCase().includes(key) ||
        String(r.name ?? '').toLowerCase().includes(key)
    );
    if (hit) return hit;
  }
  return rows[0] ?? null;
}

export async function listAccountMoves(limit = 50) {
  const { data, error } = await supabase
    .from('account_moves')
    .select('*')
    .order('date', { ascending: false })
    .limit(limit);
  if (error) {
    const retry = await supabase
      .from('account_moves')
      .select('*')
      .limit(limit);
    if (retry.error) throw retry.error;
    return retry.data ?? [];
  }
  return data ?? [];
}

export async function listMoveLines(moveId: string | number) {
  const { data, error } = await supabase
    .from('account_move_lines')
    .select('*')
    .eq('move_id', moveId);
  if (error) throw error;
  return data ?? [];
}

export async function postDoubleEntry(input: {
  journal_id?: string | number | null;
  name: string;
  ref?: string | null;
  move_type: string;
  date?: string;
  debit_account_id: string | number;
  credit_account_id: string | number;
  amount: number;
  partner_id?: string | number | null;
  created_by?: string | null;
}) {
  if (input.amount <= 0) throw new Error('Amount must be greater than zero');

  const journal =
    input.journal_id != null
      ? { journal_id: input.journal_id, id: input.journal_id }
      : await findJournal([input.move_type.toLowerCase(), 'general', 'misc']);

  if (!journal) throw new Error('No account journal configured in Masters');

  const journalId = (journal as any).journal_id ?? (journal as any).id;
  const moveDate = input.date ?? todayISO();

  const moveAttempts = [
    {
      journal_id: journalId,
      name: input.name,
      date: moveDate,
      ref: input.ref ?? null,
      state: 'POSTED',
      move_type: input.move_type,
      created_by: input.created_by ?? null,
    },
    {
      journal_id: journalId,
      name: input.name,
      date: moveDate,
      ref: input.ref ?? null,
      state: 'POSTED',
      move_type: input.move_type,
    },
    {
      journal_id: journalId,
      name: input.name,
      date: moveDate,
      state: 'draft',
      move_type: input.move_type,
    },
  ];

  let move: any = null;
  let lastErr: unknown = null;
  for (const payload of moveAttempts) {
    const { data, error } = await supabase
      .from('account_moves')
      .insert(payload)
      .select()
      .single();
    if (!error) {
      move = data;
      break;
    }
    lastErr = error;
  }
  if (!move) throw lastErr ?? new Error('Failed to create account move');

  const moveId = move.move_id ?? move.id;

  const lineCommon = {
    move_id: moveId,
    partner_id: input.partner_id ?? null,
  };

  const debitLine = {
    ...lineCommon,
    account_id: input.debit_account_id,
    name: `${input.name} (Dr)`,
    debit: input.amount,
    credit: 0,
  };
  const creditLine = {
    ...lineCommon,
    account_id: input.credit_account_id,
    name: `${input.name} (Cr)`,
    debit: 0,
    credit: input.amount,
  };

  const { error: lineErr } = await supabase
    .from('account_move_lines')
    .insert([debitLine, creditLine]);
  if (lineErr) {
    // rollback move best-effort
    await supabase.from('account_moves').delete().eq('move_id', moveId);
    await supabase.from('account_moves').delete().eq('id', moveId);
    throw lineErr;
  }

  return { move, moveId };
}

/** Vendor purchase bill: Debit Inventory / Credit Payables */
export async function postPurchaseBill(input: {
  vendor_id: string | number;
  invoice_number: string;
  amount: number;
  created_by?: string | null;
}) {
  const inventory = await findAccountByType(['inventory', 'stock', 'asset']);
  const payable = await findAccountByType(['payable', 'liability', 'creditor']);
  if (!inventory || !payable) {
    throw new Error('Configure Inventory and Accounts Payable in Masters → Accounts');
  }
  const journal = await findJournal(['purchase', 'bill', 'vendor', 'general']);
  return postDoubleEntry({
    journal_id: (journal as any)?.journal_id ?? (journal as any)?.id,
    name: `Purchase bill ${input.invoice_number}`,
    ref: input.invoice_number,
    move_type: 'IN_BILL',
    debit_account_id: (inventory as any).account_id ?? (inventory as any).id,
    credit_account_id: (payable as any).account_id ?? (payable as any).id,
    amount: input.amount,
    partner_id: input.vendor_id,
    created_by: input.created_by,
  });
}

/** Customer invoice: Debit Receivable / Credit Revenue (+ optional COGS) */
export async function postSalesInvoice(input: {
  customer_id?: string | number | null;
  invoice_ref?: string | null;
  revenue: number;
  cogs?: number;
  created_by?: string | null;
}) {
  const receivable = await findAccountByType(['receivable', 'debtor', 'asset']);
  const revenue = await findAccountByType(['revenue', 'income', 'sales']);
  if (!receivable || !revenue) {
    throw new Error('Configure Receivable and Sales Revenue in Masters → Accounts');
  }
  const journal = await findJournal(['sale', 'invoice', 'customer', 'general']);
  const invoice = await postDoubleEntry({
    journal_id: (journal as any)?.journal_id ?? (journal as any)?.id,
    name: `Sales invoice ${input.invoice_ref ?? todayISO()}`,
    ref: input.invoice_ref ?? null,
    move_type: 'OUT_INVOICE',
    debit_account_id: (receivable as any).account_id ?? (receivable as any).id,
    credit_account_id: (revenue as any).account_id ?? (revenue as any).id,
    amount: input.revenue,
    partner_id: input.customer_id ?? null,
    created_by: input.created_by,
  });

  if (input.cogs && input.cogs > 0) {
    const cogsAcct = await findAccountByType(['cogs', 'cost of', 'expense']);
    const inventory = await findAccountByType(['inventory', 'stock', 'asset']);
    if (cogsAcct && inventory) {
      await postDoubleEntry({
        journal_id: (journal as any)?.journal_id ?? (journal as any)?.id,
        name: `COGS ${input.invoice_ref ?? todayISO()}`,
        ref: input.invoice_ref ?? null,
        move_type: 'OUT_INVOICE',
        debit_account_id: (cogsAcct as any).account_id ?? (cogsAcct as any).id,
        credit_account_id: (inventory as any).account_id ?? (inventory as any).id,
        amount: input.cogs,
        partner_id: input.customer_id ?? null,
        created_by: input.created_by,
      });
    }
  }

  return invoice;
}

export async function postExpenseEntry(input: {
  expense_head_id?: string | number | null;
  debit_account_id: string | number;
  credit_account_id: string | number;
  amount: number;
  name: string;
  ref?: string | null;
  created_by?: string | null;
}) {
  const journal = await findJournal(['expense', 'misc', 'general']);
  return postDoubleEntry({
    journal_id: (journal as any)?.journal_id ?? (journal as any)?.id,
    name: input.name,
    ref: input.ref ?? null,
    move_type: 'EXPENSE',
    debit_account_id: input.debit_account_id,
    credit_account_id: input.credit_account_id,
    amount: input.amount,
    created_by: input.created_by,
  });
}

export async function voidAccountMove(moveId: string | number) {
  const { data, error } = await supabase
    .from('account_moves')
    .update({ state: 'CANCELLED' })
    .eq('move_id', moveId)
    .select()
    .single();
  if (error) {
    const retry = await supabase
      .from('account_moves')
      .update({ state: 'CANCELLED' })
      .eq('id', moveId)
      .select()
      .single();
    if (retry.error) throw retry.error;
    return retry.data;
  }
  return data;
}
