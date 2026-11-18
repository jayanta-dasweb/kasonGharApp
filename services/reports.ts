import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';

export type ReportPeriod = 'day' | 'month' | 'fy' | 'salesperson';

export async function fetchReport(period: ReportPeriod) {
  const viewMap = {
    day: 'report_day_wise',
    month: 'report_month_wise',
    fy: 'report_fy_wise',
    salesperson: 'report_salesperson_summary',
  } as const;

  const { data, error } = await supabase.from(viewMap[period]).select('*');
  if (error) throw error;
  return data ?? [];
}

export async function getKpiTotals() {
  // Prefer FY view; fall back to salesperson summary aggregates
  const { data: fy, error: fyErr } = await supabase
    .from('report_fy_wise')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (!fyErr && fy) {
    return {
      totalRevenue: Number(
        (fy as any).total_revenue ?? (fy as any).total_sales_value ?? 0
      ),
      netProfit: Number((fy as any).net_profit ?? 0),
    };
  }

  const { data: rows, error } = await supabase
    .from('report_salesperson_summary')
    .select('*');
  if (error) throw error;

  const totalRevenue = (rows ?? []).reduce(
    (s, r: any) => s + Number(r.total_sales_value ?? r.total_revenue ?? 0),
    0
  );
  const totalSold = (rows ?? []).reduce(
    (s, r: any) => s + Number(r.total_sold_qty ?? r.total_qty ?? 0),
    0
  );

  return { totalRevenue, netProfit: 0, totalSold };
}

export async function exportRowsToXlsx(
  rows: Record<string, unknown>[],
  fileName: string
) {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Report');
  const base64 = XLSX.write(book, { type: 'base64', bookType: 'xlsx' });
  const path = `${FileSystem.cacheDirectory}${fileName}.xlsx`;
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, {
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Share Excel',
    });
  }
  return path;
}

export async function exportRowsToCsv(
  rows: Record<string, unknown>[],
  fileName: string
) {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(sheet);
  const path = `${FileSystem.cacheDirectory}${fileName}.csv`;
  await FileSystem.writeAsStringAsync(path, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, {
      mimeType: 'text/csv',
      dialogTitle: 'Share CSV',
    });
  }
  return path;
}
