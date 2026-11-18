export type NoticePreset = {
  key: string;
  label: string;
  title: string;
  body: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  audience: 'ALL' | 'salesperson' | 'admin' | 'USERS';
};

/** Free preset templates — admin can still edit before send */
export const NOTICE_PRESETS: NoticePreset[] = [
  {
    key: 'stock_check',
    label: 'Stock check',
    title: 'মজুত পৰীক্ষা · Stock check',
    body: 'Please verify your assigned stock and update status before evening close.',
    priority: 'HIGH',
    audience: 'salesperson',
  },
  {
    key: 'price_update',
    label: 'Price update',
    title: 'দাম আপডেট · Price update',
    body: 'New MRP / min price has been updated. Check catalog for latest prices.',
    priority: 'NORMAL',
    audience: 'ALL',
  },
  {
    key: 'meeting',
    label: 'Meeting / visit',
    title: 'সভা / ভিজিট',
    body: 'Please attend the scheduled meeting / shop visit. Confirm after done.',
    priority: 'HIGH',
    audience: 'salesperson',
  },
  {
    key: 'holiday',
    label: 'Holiday notice',
    title: 'ছুটিৰ জাননী · Holiday',
    body: 'Shop / office holiday notice. Sales reconcile must be completed before leave.',
    priority: 'NORMAL',
    audience: 'ALL',
  },
  {
    key: 'urgent_recall',
    label: 'Urgent recall',
    title: 'জৰুৰী · Urgent recall',
    body: 'Urgent: return / report pending stock immediately. Contact office now.',
    priority: 'URGENT',
    audience: 'salesperson',
  },
  {
    key: 'custom',
    label: 'Custom message',
    title: '',
    body: '',
    priority: 'NORMAL',
    audience: 'ALL',
  },
];
