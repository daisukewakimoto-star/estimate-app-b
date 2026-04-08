export const TEMPLATE_ITEMS = [
  { category: "テラス防錆工事", categoryId: "rust", items: [
    { id: "r1", name: "ケレン作業（錆落とし・旧塗膜除去）", qty: "", unit: "㎡", price: "" },
    { id: "r2", name: "下地処理（防錆プライマー塗布）", qty: "", unit: "㎡", price: "" },
    { id: "r3", name: "中塗り塗装", qty: "", unit: "㎡", price: "" },
    { id: "r4", name: "上塗り塗装（防錆仕上げ）", qty: "", unit: "㎡", price: "" },
    { id: "r5", name: "養生費（マスキング・飛散防止）", qty: "1", unit: "式", price: "" },
  ]},
  { category: "電気工事", categoryId: "elec", items: [
    { id: "e1", name: "分電盤増設・電力容量変更工事", qty: "1", unit: "式", price: "" },
    { id: "e2", name: "シーリングファン用配線工事", qty: "4", unit: "箇所", price: "" },
    { id: "e3", name: "ラインライト用配線工事", qty: "1", unit: "式", price: "" },
    { id: "e4", name: "LEDラインライト本体（15m）", qty: "4", unit: "本", price: "" },
    { id: "e5", name: "ラインライト取付工事", qty: "4", unit: "本", price: "" },
  ]},
  { category: "シーリングファン設置工事", categoryId: "fan", items: [
    { id: "f1", name: "シーリングファン本体", qty: "4", unit: "台", price: "" },
    { id: "f2", name: "取付金具・補助部材", qty: "4", unit: "セット", price: "" },
    { id: "f3", name: "シーリングファン取付工事費", qty: "4", unit: "台", price: "" },
  ]},
  { category: "ルーバー下 雨吹込み防止工事（右サイド）", categoryId: "louver", items: [
    { id: "l1", name: "防雨パネル・部材", qty: "", unit: "㎡", price: "" },
    { id: "l2", name: "取付工事費", qty: "1", unit: "式", price: "" },
    { id: "l3", name: "シーリング処理（隙間防水）", qty: "", unit: "m", price: "" },
  ]},
  { category: "共通費", categoryId: "common", items: [
    { id: "c1", name: "現場管理費", qty: "1", unit: "式", price: "" },
    { id: "c2", name: "廃材処分費", qty: "1", unit: "式", price: "" },
    { id: "c3", name: "資材運搬費", qty: "1", unit: "式", price: "" },
  ]},
];

export const UNITS = ["㎡","m","箇所","台","本","セット","個","缶","式"];

export const CATEGORY_ICONS: Record<string,string> = {
  rust:"🔧", elec:"⚡", fan:"🌀", louver:"🌧️", common:"📋"
};

export const CATEGORY_COLORS: Record<string,string> = {
  rust:"#c45d3e", elec:"#d4a017", fan:"#2e86ab", louver:"#5a9e6f", common:"#6b6b6b"
};

export const fmt = (n: number | string) => {
  if (!n && n !== 0) return "";
  return Number(n).toLocaleString("ja-JP");
};

export const pn = (s: string | number) => {
  const v = parseFloat(String(s).replace(/,/g, ""));
  return isNaN(v) ? 0 : v;
};

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
};

export const catSum = (items: any[]) =>
  items.reduce((s: number, i: any) => s + pn(i.qty) * pn(i.price), 0);

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export interface EstimateItem {
  id: string;
  name: string;
  qty: string;
  unit: string;
  price: string;
}

export interface Category {
  category: string;
  categoryId: string;
  items: EstimateItem[];
}

export interface CompanyInfo {
  name: string;
  address: string;
  tel: string;
  invoice: string;
}

export interface ClientInfo {
  name: string;
  address: string;
}

export interface Estimate {
  id: string;
  title: string;
  createdAt: string;
  categories: Category[];
  companyInfo: CompanyInfo;
  clientInfo: ClientInfo;
  notes: string;
}
