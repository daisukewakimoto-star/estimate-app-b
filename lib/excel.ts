import * as XLSX from "xlsx";
import { Category, CompanyInfo, ClientInfo } from "./constants";
import { pn, catSum, today, fmt } from "./constants";

export function exportExcel(
  categories: Category[],
  companyInfo: CompanyInfo,
  clientInfo: ClientInfo,
  title: string,
  filterCatId: string | null
) {
  const cats = filterCatId
    ? categories.filter((c) => c.categoryId === filterCatId)
    : categories;

  const rows: any[][] = [];
  rows.push(["御見積書"]);
  rows.push(["宛先", clientInfo.name + " 御中"]);
  rows.push(["件名", title]);
  rows.push(["見積日", today()]);
  rows.push(["施工会社", companyInfo.name]);
  if (companyInfo.tel) rows.push(["TEL", companyInfo.tel]);
  if (companyInfo.invoice) rows.push(["登録番号", companyInfo.invoice]);
  rows.push([]);
  rows.push(["No.", "工事区分", "品名・工事内容", "数量", "単位", "単価（円）", "金額（円）"]);

  let no = 1;
  let grand = 0;
  cats.forEach((cat) => {
    const sub = catSum(cat.items);
    grand += sub;
    cat.items.forEach((it) => {
      const amt = pn(it.qty) * pn(it.price);
      rows.push([no++, cat.category, it.name, pn(it.qty) || "", it.unit, pn(it.price) || "", amt || ""]);
    });
    rows.push(["", "", cat.category + " 小計（税抜）", "", "", "", sub]);
    rows.push(["", "", "消費税（10%）", "", "", "", Math.floor(sub * 0.1)]);
    rows.push(["", "", "税込小計", "", "", "", sub + Math.floor(sub * 0.1)]);
    rows.push([]);
  });

  const tax = Math.floor(grand * 0.1);
  rows.push([]);
  rows.push(["", "", "合計（税抜）", "", "", "", grand]);
  rows.push(["", "", "消費税（10%）", "", "", "", tax]);
  rows.push(["", "", "合計（税込）", "", "", "", grand + tax]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 5 }, { wch: 22 }, { wch: 32 },
    { wch: 8 }, { wch: 6 }, { wch: 14 }, { wch: 16 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "見積書");

  const fn = filterCatId
    ? `見積書_${cats[0]?.category || "工事"}_${today()}.xlsx`
    : `見積書_全工事_${today()}.xlsx`;

  XLSX.writeFile(wb, fn);
}
