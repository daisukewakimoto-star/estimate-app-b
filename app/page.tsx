"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { loadAll, saveAll } from "@/lib/storage";
import { exportExcel } from "@/lib/excel";
import {
  TEMPLATE_ITEMS, UNITS, CATEGORY_ICONS as IC, CATEGORY_COLORS as CC,
  fmt, pn, today, catSum, uid,
  Estimate, Category,
} from "@/lib/constants";

/* ───── Sub Components ───── */

function TaxBox({ label, subtotal, color }: { label: string; subtotal: number; color: string }) {
  const tax = Math.floor(subtotal * 0.1);
  return (
    <div style={{ background: "#f9f9f5", borderRadius: 8, padding: "10px 12px", marginTop: 8, border: `1px solid ${color}30` }}>
      <div style={{ fontSize: 11, fontWeight: 600, color, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
        <span style={{ color: "#888" }}>税抜</span><span style={{ fontWeight: 600 }}>¥{fmt(subtotal)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
        <span style={{ color: "#aaa" }}>消費税 10%</span><span>¥{fmt(tax)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, borderTop: "1px solid #e0e0d8", paddingTop: 4, color }}>
        <span>税込合計</span><span>¥{fmt(subtotal + tax)}</span>
      </div>
    </div>
  );
}

function ExportBar({ onPDF, onExcel }: { onPDF: () => void; onExcel: () => void }) {
  return (
    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
      <button onClick={onPDF} style={{ flex: 1, padding: "8px 0", borderRadius: 6, border: "1px solid #ccc", background: "#fff", fontSize: 11, cursor: "pointer", color: "#555", fontWeight: 600 }}>
        📄 PDF出力
      </button>
      <button onClick={onExcel} style={{ flex: 1, padding: "8px 0", borderRadius: 6, border: "1px solid #ccc", background: "#fff", fontSize: 11, cursor: "pointer", color: "#555", fontWeight: 600 }}>
        📊 Excel出力
      </button>
    </div>
  );
}

/* ───── Print View ───── */

function PrintView({ est, filterCatId, onClose }: { est: Estimate; filterCatId: string | null; onClose: () => void }) {
  const cats = filterCatId ? est.categories.filter(c => c.categoryId === filterCatId) : est.categories;
  const grand = cats.reduce((s, c) => s + catSum(c.items), 0);
  const tax = Math.floor(grand * 0.1);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "#fff", zIndex: 9999, overflow: "auto", padding: "8mm 6mm", fontSize: 10, color: "#1a1a1a", lineHeight: 1.5 }}>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <button onClick={onClose} style={{ background: "#2d2d2d", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>← 戻る</button>
        <button onClick={() => window.print()} style={{ background: "#2e86ab", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>🖨 PDF保存</button>
      </div>

      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: 6 }}>御 見 積 書</h1>
        {filterCatId && <p style={{ fontSize: 11, color: "#666", margin: "4px 0 0" }}>（{cats[0]?.category}）</p>}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px", borderBottom: "2px solid #1a1a1a", paddingBottom: 2, display: "inline-block" }}>
            {est.clientInfo.name || "（宛名）"} 御中
          </p>
          {est.clientInfo.address && <p style={{ margin: "2px 0", fontSize: 9 }}>{est.clientInfo.address}</p>}
        </div>
        <div style={{ textAlign: "right", fontSize: 9 }}>
          <p style={{ margin: "1px 0" }}>見積日：{today()}</p>
          <p style={{ margin: "1px 0" }}>有効期限：見積日より90日</p>
        </div>
      </div>

      <div style={{ background: "#f5f5f0", border: "1px solid #ccc", borderRadius: 4, padding: "8px 12px", marginBottom: 12, textAlign: "center" }}>
        <span style={{ fontSize: 11 }}>お見積金額（税込）</span>
        <span style={{ fontSize: 20, fontWeight: 700, marginLeft: 12 }}>¥{fmt(grand + tax)}</span>
      </div>

      <p style={{ fontSize: 9, margin: "0 0 4px" }}>件名：{est.title}</p>
      <p style={{ fontSize: 9, margin: "0 0 8px" }}>工事場所：沖縄県豊見城市瀬長 ウミカジテラス内 SEE THE SEA</p>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9, marginBottom: 8 }}>
        <thead>
          <tr style={{ background: "#2d2d2d", color: "#fff" }}>
            {["No.", "品名・工事内容", "数量", "単位", "単価（円）", "金額（円）"].map((h, i) => (
              <th key={i} style={{ padding: "4px 6px", textAlign: [0, 1].includes(i) ? "left" : i === 3 ? "center" : "right", width: ["6%", "40%", "10%", "8%", "16%", "20%"][i] }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cats.map(cat => {
            const sub = catSum(cat.items);
            const ctax = Math.floor(sub * 0.1);
            return [
              <tr key={`h-${cat.categoryId}`} style={{ background: "#e8e8e0" }}>
                <td colSpan={5} style={{ padding: "4px 6px", fontWeight: 700 }}>{cat.category}</td>
                <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 700 }}>{sub > 0 ? fmt(sub) : ""}</td>
              </tr>,
              ...cat.items.map((it, idx) => {
                const amt = pn(it.qty) * pn(it.price);
                return (
                  <tr key={it.id} style={{ borderBottom: "1px solid #ddd" }}>
                    <td style={{ padding: "3px 6px", color: "#666" }}>{idx + 1}</td>
                    <td style={{ padding: "3px 6px" }}>{it.name}</td>
                    <td style={{ padding: "3px 6px", textAlign: "right" }}>{it.qty || "-"}</td>
                    <td style={{ padding: "3px 6px", textAlign: "center" }}>{it.unit}</td>
                    <td style={{ padding: "3px 6px", textAlign: "right" }}>{it.price ? fmt(it.price) : "-"}</td>
                    <td style={{ padding: "3px 6px", textAlign: "right" }}>{amt ? fmt(amt) : "-"}</td>
                  </tr>
                );
              }),
              <tr key={`tax-${cat.categoryId}`} style={{ background: "#fafaf5" }}>
                <td colSpan={5} style={{ padding: "2px 6px", textAlign: "right", fontSize: 8, color: "#888" }}>消費税（10%）</td>
                <td style={{ padding: "2px 6px", textAlign: "right", fontSize: 8, color: "#888" }}>{fmt(ctax)}</td>
              </tr>,
              <tr key={`inc-${cat.categoryId}`} style={{ background: "#fafaf5", borderBottom: "2px solid #ddd" }}>
                <td colSpan={5} style={{ padding: "2px 6px", textAlign: "right", fontSize: 9, fontWeight: 600 }}>税込小計</td>
                <td style={{ padding: "2px 6px", textAlign: "right", fontSize: 9, fontWeight: 600 }}>{fmt(sub + ctax)}</td>
              </tr>,
            ];
          })}
          <tr style={{ borderTop: "2px solid #1a1a1a" }}>
            <td colSpan={5} style={{ padding: "4px 6px", textAlign: "right", fontWeight: 700 }}>合計（税抜）</td>
            <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 700 }}>{fmt(grand)}</td>
          </tr>
          <tr>
            <td colSpan={5} style={{ padding: "3px 6px", textAlign: "right" }}>消費税（10%）</td>
            <td style={{ padding: "3px 6px", textAlign: "right" }}>{fmt(tax)}</td>
          </tr>
          <tr style={{ background: "#2d2d2d", color: "#fff" }}>
            <td colSpan={5} style={{ padding: "5px 6px", textAlign: "right", fontWeight: 700, fontSize: 11 }}>合計（税込）</td>
            <td style={{ padding: "5px 6px", textAlign: "right", fontWeight: 700, fontSize: 11 }}>¥{fmt(grand + tax)}</td>
          </tr>
        </tbody>
      </table>

      {est.notes && (
        <div style={{ fontSize: 9, margin: "8px 0", padding: "6px 8px", background: "#fafaf5", border: "1px solid #e0e0d8", borderRadius: 3 }}>
          <p style={{ fontWeight: 600, margin: "0 0 2px" }}>備考</p>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{est.notes}</p>
        </div>
      )}

      <div style={{ marginTop: 16, paddingTop: 8, borderTop: "1px solid #ccc", fontSize: 9, textAlign: "right" }}>
        <p style={{ fontWeight: 700, margin: "0 0 2px", fontSize: 11 }}>{est.companyInfo.name || "（施工会社名）"}</p>
        {est.companyInfo.address && <p style={{ margin: "1px 0" }}>{est.companyInfo.address}</p>}
        {est.companyInfo.tel && <p style={{ margin: "1px 0" }}>TEL: {est.companyInfo.tel}</p>}
        {est.companyInfo.invoice && <p style={{ margin: "1px 0" }}>登録番号: {est.companyInfo.invoice}</p>}
      </div>
    </div>
  );
}

/* ───── List View ───── */

function ListView({ estimates, onSelect, onCreate, onDelete }: any) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  return (
    <div style={{ minHeight: "100vh", background: "#f7f6f1", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg,#2d2d2d,#434343)", color: "#fff", padding: "20px 16px" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: 2 }}>📋 見積一覧</h1>
        <p style={{ fontSize: 11, margin: "4px 0 0", opacity: 0.7 }}>工事受注・見積管理</p>
      </div>
      <div style={{ padding: 12 }}>
        <button onClick={onCreate} style={{ width: "100%", padding: 14, borderRadius: 10, border: "2px dashed #2e86ab", background: "#f0f8ff", fontSize: 14, color: "#2e86ab", cursor: "pointer", fontWeight: 700, marginBottom: 16 }}>
          ＋ 新しい見積を作成
        </button>
        {estimates.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#aaa" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📝</div>
            <p style={{ fontSize: 13 }}>まだ見積がありません</p>
          </div>
        )}
        {estimates.map((est: Estimate, idx: number) => {
          const grand = est.categories.reduce((s: number, c: Category) => s + catSum(c.items), 0);
          const filled = est.categories.reduce((s: number, c: Category) => s + c.items.filter(i => pn(i.price) > 0).length, 0);
          const total = est.categories.reduce((s: number, c: Category) => s + c.items.length, 0);
          const pct = total > 0 ? Math.round(filled / total * 100) : 0;
          const isFirst = idx === 0;
          const isConfirming = confirmId === est.id;
          return (
            <div key={est.id} onClick={() => { if (!isConfirming) onSelect(est.id); }} style={{ background: "#fff", borderRadius: 10, padding: "14px 16px", marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", cursor: isConfirming ? "default" : "pointer", borderLeft: `4px solid ${pct === 100 ? "#4ade80" : pct > 0 ? "#f59e0b" : "#ddd"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{est.title || "無題の見積"}</div>
                  <div style={{ fontSize: 10, color: "#999" }}>{est.clientInfo?.name || "宛先未設定"}</div>
                  <div style={{ fontSize: 10, color: "#bbb", marginTop: 2 }}>作成：{est.createdAt || "-"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>¥{fmt(grand + Math.floor(grand * 0.1))}</div>
                  <div style={{ fontSize: 9, color: "#999" }}>税込</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <div style={{ flex: 1, height: 4, background: "#eee", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#4ade80" : "#f59e0b", borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 10, color: "#999" }}>{pct}%</span>
                {!isFirst && (
                  <button onClick={e => { e.stopPropagation(); setConfirmId(est.id); }} style={{ background: "none", border: "none", fontSize: 14, color: "#ddd", cursor: "pointer", padding: "0 4px" }}>🗑</button>
                )}
              </div>
              {isConfirming && (
                <div style={{ marginTop: 10, background: "#fff4f4", border: "1px solid #ffcccc", borderRadius: 6, padding: "10px 12px", textAlign: "center" }}>
                  <p style={{ fontSize: 11, color: "#c00", margin: "0 0 8px", fontWeight: 600 }}>この見積を削除しますか？</p>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <button onClick={e => { e.stopPropagation(); onDelete(est.id); setConfirmId(null); }} style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: "#dc2626", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>削除する</button>
                    <button onClick={e => { e.stopPropagation(); setConfirmId(null); }} style={{ padding: "6px 16px", borderRadius: 6, border: "1px solid #ccc", background: "#fff", color: "#666", fontSize: 11, cursor: "pointer" }}>やめる</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════ MAIN ═══════ */

export default function Page() {
  const [view, setView] = useState<"list" | "edit" | "print">("list");
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [printCatId, setPrintCatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [activeCategory, setActiveCategory] = useState("rust");
  const timer = useRef<any>(null);
  const skipSave = useRef(true);

  const current = estimates.find(e => e.id === currentId) || null;

  useEffect(() => {
    const d = loadAll();
    if (d.length > 0) setEstimates(d);
    setIsLoading(false);
    setTimeout(() => { skipSave.current = false; }, 200);
  }, []);

  useEffect(() => {
    if (skipSave.current) return;
    setSaveStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const ok = saveAll(estimates);
      setSaveStatus(ok ? "saved" : "error");
    }, 600);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [estimates]);

  const updateEst = useCallback((id: string, fn: (e: Estimate) => Estimate) => {
    setEstimates(p => p.map(e => e.id === id ? fn(e) : e));
  }, []);

  const createNew = () => {
    const ne: Estimate = {
      id: uid(), title: "SEE THE SEA テラス改修工事", createdAt: today(),
      categories: JSON.parse(JSON.stringify(TEMPLATE_ITEMS)),
      companyInfo: { name: "株式会社B社", address: "沖縄県豊見城市", tel: "", invoice: "" },
      clientInfo: { name: "オリエンタルスタンダード株式会社", address: "東京都台東区" },
      notes: "工事場所：沖縄県豊見城市瀬長 ウミカジテラス内 SEE THE SEA\n支払条件：完工後30日以内\n工期：着工後約　　日間（天候による変動あり）",
    };
    setEstimates(p => [ne, ...p]);
    setCurrentId(ne.id);
    setActiveCategory("rust");
    setView("edit");
  };

  const deleteEst = (id: string) => {
    setEstimates(p => p.filter(e => e.id !== id));
  };

  const selectEst = (id: string) => { setCurrentId(id); setActiveCategory("rust"); setView("edit"); };

  const updateItem = (catId: string, itemId: string, field: string, val: string) => {
    updateEst(currentId!, e => ({ ...e, categories: e.categories.map(c => c.categoryId !== catId ? c : { ...c, items: c.items.map(i => i.id !== itemId ? i : { ...i, [field]: val }) }) }));
  };
  const addItem = (catId: string) => {
    updateEst(currentId!, e => ({ ...e, categories: e.categories.map(c => c.categoryId !== catId ? c : { ...c, items: [...c.items, { id: `${catId}-${uid()}`, name: "", qty: "", unit: "式", price: "" }] }) }));
  };
  const rmItem = (catId: string, itemId: string) => {
    updateEst(currentId!, e => ({ ...e, categories: e.categories.map(c => c.categoryId !== catId ? c : { ...c, items: c.items.filter(i => i.id !== itemId) }) }));
  };

  if (isLoading) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f6f1" }}>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 32, marginBottom: 12 }}>📋</div><p style={{ fontSize: 14, color: "#666" }}>読み込み中...</p></div>
    </div>;
  }

  if (view === "print" && current) {
    return <PrintView est={current} filterCatId={printCatId} onClose={() => setView("edit")} />;
  }

  if (view === "list") {
    return <ListView estimates={estimates} onSelect={selectEst} onCreate={createNew} onDelete={deleteEst} />;
  }

  if (!current) { setView("list"); return null; }

  const grandTotal = current.categories.reduce((s, c) => s + catSum(c.items), 0);
  const filledCount = current.categories.reduce((s, c) => s + c.items.filter(i => pn(i.price) > 0).length, 0);
  const totalCount = current.categories.reduce((s, c) => s + c.items.length, 0);
  const activeCat = current.categories.find(c => c.categoryId === activeCategory);
  const SL: Record<string, string> = { saving: "保存中...", saved: "✓ 保存済み", error: "⚠ 失敗", idle: "" };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f6f1", color: "#2d2d2d", maxWidth: 480, margin: "0 auto", paddingBottom: 110 }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#2d2d2d,#434343)", color: "#fff", padding: "14px 16px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <button onClick={() => setView("list")} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, padding: "6px 12px", color: "#fff", fontSize: 11, cursor: "pointer" }}>← 一覧</button>
          <span style={{ fontSize: 10, color: saveStatus === "saved" ? "#4ade80" : saveStatus === "saving" ? "#f59e0b" : "transparent" }}>{SL[saveStatus]}</span>
        </div>
        <input value={current.title} onChange={e => updateEst(currentId!, est => ({ ...est, title: e.target.value }))}
          style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.3)", color: "#fff", fontSize: 15, fontWeight: 700, width: "100%", padding: "2px 0", outline: "none", letterSpacing: 1 }} />
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 4 }}>
            <span>入力済み {filledCount}/{totalCount}</span>
            <span style={{ fontWeight: 700, fontSize: 14 }}>¥{fmt(grandTotal)}<span style={{ fontSize: 9, opacity: 0.7, marginLeft: 4 }}>税抜</span></span>
          </div>
          <div style={{ height: 5, background: "rgba(255,255,255,0.15)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${totalCount > 0 ? (filledCount / totalCount) * 100 : 0}%`, background: filledCount === totalCount && filledCount > 0 ? "#4ade80" : "linear-gradient(90deg,#f59e0b,#f97316)", borderRadius: 3, transition: "width 0.4s" }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", overflowX: "auto", gap: 6, padding: "10px 12px 8px", background: "#eeeee6", borderBottom: "1px solid #ddd", position: "sticky", top: 108, zIndex: 99 }}>
        {current.categories.map(cat => {
          const active = cat.categoryId === activeCategory;
          const done = cat.items.length > 0 && cat.items.every(i => pn(i.price) > 0);
          return (
            <button key={cat.categoryId} onClick={() => setActiveCategory(cat.categoryId)} style={{
              flex: "0 0 auto", padding: "7px 10px", borderRadius: 8,
              border: active ? `2px solid ${CC[cat.categoryId]}` : "2px solid transparent",
              background: active ? "#fff" : "transparent", fontSize: 10, fontWeight: active ? 700 : 400,
              color: active ? CC[cat.categoryId] : "#666", cursor: "pointer", whiteSpace: "nowrap", position: "relative",
            }}>
              <span style={{ marginRight: 3 }}>{IC[cat.categoryId]}</span>
              {cat.category.length > 6 ? cat.category.slice(0, 6) + "…" : cat.category}
              {done && <span style={{ position: "absolute", top: -3, right: -3, width: 12, height: 12, borderRadius: "50%", background: "#4ade80", color: "#fff", fontSize: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>✓</span>}
            </button>
          );
        })}
      </div>

      {/* Items */}
      {activeCat && (
        <div style={{ padding: 12 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px", color: CC[activeCategory], display: "flex", alignItems: "center", gap: 6 }}>
            {IC[activeCategory]} {activeCat.category}
          </h2>
          {activeCat.items.map(item => {
            const amt = pn(item.qty) * pn(item.price);
            return (
              <div key={item.id} style={{ background: "#fff", borderRadius: 10, padding: "10px 12px", marginBottom: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", borderLeft: `3px solid ${pn(item.price) > 0 ? "#4ade80" : CC[activeCategory] + "40"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <input value={item.name} onChange={e => updateItem(activeCat.categoryId, item.id, "name", e.target.value)}
                    style={{ fontSize: 12, fontWeight: 600, border: "none", background: "transparent", flex: 1, color: "#2d2d2d", padding: 0, outline: "none" }} placeholder="品名" />
                  <button onClick={() => rmItem(activeCat.categoryId, item.id)} style={{ background: "none", border: "none", color: "#ccc", fontSize: 16, cursor: "pointer", padding: "0 0 0 6px", lineHeight: 1 }}>×</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "78px 46px 1fr 1fr", gap: 4, alignItems: "end" }}>
                  <div>
                    <label style={{ fontSize: 7, color: "#999", display: "block", marginBottom: 2 }}>数量</label>
                    <input type="number" inputMode="decimal" value={item.qty} onChange={e => updateItem(activeCat.categoryId, item.id, "qty", e.target.value)}
                      style={{ width: "100%", padding: "8px 2px", borderRadius: 5, border: "1px solid #e0e0d8", fontSize: 13, background: "#fafaf5", textAlign: "right", boxSizing: "border-box", outline: "none" }} placeholder="0" />
                  </div>
                  <div>
                    <label style={{ fontSize: 7, color: "#999", display: "block", marginBottom: 2 }}>単位</label>
                    <select value={item.unit} onChange={e => updateItem(activeCat.categoryId, item.id, "unit", e.target.value)}
                      style={{ width: "100%", padding: "8px 0", borderRadius: 5, border: "1px solid #e0e0d8", fontSize: 11, background: "#fafaf5", textAlign: "center", boxSizing: "border-box" }}>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 7, color: "#999", display: "block", marginBottom: 2 }}>単価（円）</label>
                    <input type="number" inputMode="numeric" value={item.price} onChange={e => updateItem(activeCat.categoryId, item.id, "price", e.target.value)}
                      style={{ width: "100%", padding: "8px 4px", borderRadius: 5, border: "1px solid #e0e0d8", fontSize: 13, background: "#fafaf5", textAlign: "right", boxSizing: "border-box", outline: "none" }} placeholder="0" />
                  </div>
                  <div>
                    <label style={{ fontSize: 7, color: "#999", display: "block", marginBottom: 2 }}>小小計</label>
                    <div style={{
                      width: "100%", padding: "8px 4px", borderRadius: 5,
                      border: amt > 0 ? `1px solid ${CC[activeCategory]}40` : "1px solid #e0e0d8",
                      background: amt > 0 ? `${CC[activeCategory]}08` : "#f0f0eb",
                      fontSize: 12, fontWeight: 700, textAlign: "right",
                      color: amt > 0 ? CC[activeCategory] : "#bbb",
                      boxSizing: "border-box", userSelect: "none" as const, whiteSpace: "nowrap" as const, overflow: "hidden",
                    }}>
                      {amt > 0 ? `¥${fmt(amt)}` : "¥0"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <button onClick={() => addItem(activeCat.categoryId)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px dashed #ccc", background: "transparent", fontSize: 12, color: "#999", cursor: "pointer", marginTop: 4 }}>＋ 項目を追加</button>

          <TaxBox label={`${activeCat.category} 小計`} subtotal={catSum(activeCat.items)} color={CC[activeCategory]} />
          <ExportBar
            onPDF={() => { setPrintCatId(activeCategory); setView("print"); }}
            onExcel={() => exportExcel(current.categories, current.companyInfo, current.clientInfo, current.title, activeCategory)}
          />
        </div>
      )}

      {/* Grand Total */}
      <div style={{ padding: "0 12px", marginTop: 4 }}>
        <TaxBox label="全工事 合計" subtotal={grandTotal} color="#2d2d2d" />
        <ExportBar
          onPDF={() => { setPrintCatId(null); setView("print"); }}
          onExcel={() => exportExcel(current.categories, current.companyInfo, current.clientInfo, current.title, null)}
        />
      </div>

      {/* Company Info */}
      <div style={{ padding: "0 12px", marginTop: 12 }}>
        <details style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <summary style={{ padding: "12px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#555" }}>📝 会社情報・備考</summary>
          <div style={{ padding: "0 14px 14px" }}>
            {[
              { l: "施工会社名", v: current.companyInfo.name, k: "name" as const, ph: "" },
              { l: "住所", v: current.companyInfo.address, k: "address" as const, ph: "" },
              { l: "電話番号", v: current.companyInfo.tel, k: "tel" as const, ph: "098-XXX-XXXX" },
              { l: "インボイス登録番号", v: current.companyInfo.invoice, k: "invoice" as const, ph: "T1234567890123" },
            ].map(f => (
              <div key={f.k}>
                <label style={{ fontSize: 10, color: "#999", display: "block", margin: "8px 0 3px" }}>{f.l}</label>
                <input value={f.v} onChange={e => updateEst(currentId!, est => ({ ...est, companyInfo: { ...est.companyInfo, [f.k]: e.target.value } }))}
                  placeholder={f.ph} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #e0e0d8", fontSize: 13, boxSizing: "border-box", outline: "none" }} />
              </div>
            ))}
            <label style={{ fontSize: 10, color: "#999", display: "block", margin: "12px 0 3px" }}>備考</label>
            <textarea value={current.notes} onChange={e => updateEst(currentId!, est => ({ ...est, notes: e.target.value }))} rows={4}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #e0e0d8", fontSize: 12, boxSizing: "border-box", resize: "vertical", outline: "none" }} />
          </div>
        </details>
      </div>

      {/* Bottom Bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #ddd", padding: "8px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 100, maxWidth: 480, margin: "0 auto", boxSizing: "border-box" }}>
        <div>
          <div style={{ fontSize: 9, color: "#999" }}>税込合計</div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>¥{fmt(grandTotal + Math.floor(grandTotal * 0.1))}</div>
        </div>
        <button onClick={() => { setPrintCatId(null); setView("print"); }} disabled={filledCount === 0} style={{
          padding: "10px 20px", borderRadius: 8, border: "none",
          background: filledCount === 0 ? "#ccc" : "linear-gradient(135deg,#2d2d2d,#555)",
          color: "#fff", fontSize: 13, fontWeight: 700,
          cursor: filledCount === 0 ? "not-allowed" : "pointer", letterSpacing: 1,
        }}>見積書を表示</button>
      </div>
    </div>
  );
}
