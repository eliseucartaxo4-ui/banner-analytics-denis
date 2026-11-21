(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const isPublic = !["localhost", "127.0.0.1"].includes(location.hostname);
  if (isPublic) document.body.classList.add("public");
  let data = null, shareInfo = {}, apiBase = "";
  const number = n => new Intl.NumberFormat("ru-RU").format(n || 0);
  const shownViews = rows => rows.some(p => Number(p.views) > 0) ? number(sum(rows)) : "—";
  const esc = x => String(x ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const platformName = x => ({youtube:"YouTube", tiktok:"TikTok", instagram:"Instagram"}[String(x || "").toLowerCase()] || x || "—");
  const date = x => { const d = new Date(Number(x) * 1000); return Number.isFinite(d.getTime()) && Number(x) > 0 ? d.toLocaleDateString("ru-RU") : "—"; };
  const readJson = async (url, options) => { const isApi = url.startsWith("/api/banner-analytics"); let res = await fetch((isApi ? apiBase : "") + url, options); if (isApi && !apiBase && res.status === 404) { apiBase = "http://127.0.0.1:8769"; res = await fetch(apiBase + url, options); } if (!res.ok) { const error = await res.json().catch(() => ({})); throw new Error(error.detail || `Ошибка ${res.status}`); } return res.json(); };
  const viewsBadge = n => n > 50 ? `<span class="state ok">${number(n)} просмотров</span>` : n > 0 ? `<span class="state low">${number(n)} просмотров</span>` : '<span class="state unknown">Нет данных или 0</span>';
  const options = (select, values, empty) => { const old = select.value; select.innerHTML = `<option value="">${empty}</option>` + values.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join(""); if (values.includes(old)) select.value = old; };

  function filtered() {
    const b = $("banner").value, person = $("person").value, platform = $("platform").value, q = $("search").value.trim().toLowerCase();
    return (data.publications || []).filter(p => (!b || p.banner === b) && (!person || p.person === person) && (!platform || String(p.platform).toLowerCase() === platform) && (!q || `${p.person} ${p.profile} ${p.account}`.toLowerCase().includes(q)));
  }
  function sum(rows) { return rows.reduce((s,p) => s + (Number(p.views) || 0), 0); }
  function render() {
    const rows = filtered(), views = sum(rows), unknown = rows.filter(p => !(Number(p.views) > 0)).length;
    const accountCount = new Set(rows.map(p => `${p.person}\0${p.platform}\0${p.profile}`)).size;
    $("metrics").innerHTML = [["ПРОСМОТРЫ · ПРЕДВАРИТЕЛЬНО",shownViews(rows),"сумма доступных значений, требует проверки"],["ПУБЛИКАЦИИ",number(rows.length),"отдельно на каждой площадке"],["АККАУНТЫ",number(accountCount),"которые публиковали эти ролики"],["НЕТ ДАННЫХ ИЛИ 0",number(unknown),"требуется обновление статистики"]].map(([a,b,c]) => `<div class="metric"><div class="metric-label">${a}</div><div class="metric-value">${b}</div><div class="metric-note">${c}</div></div>`).join("");
    const names = [...new Set(rows.map(p => p.banner))].sort();
    $("cards").innerHTML = names.length ? names.map(b => { const r = rows.filter(p => p.banner === b); return `<div class="banner-card" data-banner="${esc(b)}"><span class="tag">РЕКЛАМНАЯ ПЛАШКА</span><p class="big">${esc(b)}</p><div class="metric-value">${shownViews(r)}</div><div class="muted">учтено просмотров · ${number(r.length)} публикаций</div></div>`; }).join("") : '<div class="empty">Публикации с баннерами по выбранным фильтрам не найдены.</div>';
    const accounts = new Map();
    rows.forEach(p => { const key = `${p.person}\0${p.platform}\0${p.profile}`; if (!accounts.has(key)) accounts.set(key, {person:p.person, account:p.account, profile:p.profile, platform:p.platform, videos:[], url:p.account_url}); accounts.get(key).videos.push(p); });
    const groups = [...accounts.values()].sort((a,b) => sum(b.videos)-sum(a.videos));
    $("accounts").innerHTML = groups.length ? `<div class="table-wrap"><table><thead><tr><th>Аккаунт</th><th>Клиент</th><th>Площадка</th><th>Публикаций</th><th>Просмотры</th><th>Нет данных или 0</th></tr></thead><tbody>${groups.map(a => `<tr><td>${a.url ? `<a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${esc(a.account)} ↗</a>` : esc(a.account)}<small>${esc(a.profile)}</small></td><td>${esc(a.person)}</td><td>${esc(platformName(a.platform))}</td><td>${number(a.videos.length)}</td><td>${shownViews(a.videos)}</td><td>${number(a.videos.filter(p => !(Number(p.views)>0)).length)}</td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">Пока нет аккаунтов по выбранным условиям.</div>';
    const vf = $("view-filter").value;
    const filteredRows = rows.filter(p => vf === "all" || (vf === "low" ? p.views > 0 && p.views <= 50 : !(p.views > 0)));
    $("publications").innerHTML = filteredRows.length ? `<div class="table-wrap"><table><thead><tr><th>Баннер</th><th>Клиент / аккаунт</th><th>Площадка</th><th>Дата</th><th>Просмотры</th><th>Ссылка</th>${isPublic ? "" : "<th></th>"}</tr></thead><tbody>${filteredRows.slice(0,1000).map(p => `<tr><td>${esc(p.banner)}<small>${esc(p.evidence || "")}</small></td><td>${esc(p.person)}<small>${esc(p.account)} · ${esc(p.profile)}</small></td><td>${esc(platformName(p.platform))}</td><td>${date(p.published_at)}</td><td>${viewsBadge(p.views)}<small>${esc(p.views_source || "из базы")}${p.views_checked_at ? ` · ${date(p.views_checked_at)}` : ""}</small></td><td>${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${p.has_video_id ? "Открыть ролик ↗" : "Открыть профиль ↗"}</a>` : "—"}</td>${isPublic ? "" : `<td><button class="text-button" data-assign="${p.id}">Изменить</button><br><button class="text-button" data-remove="${p.id}">Убрать из отчёта</button></td>`}</tr>`).join("")}</tbody></table></div>` : '<div class="empty">Нет публикаций по выбранным условиям.</div>';
    if (!isPublic) {
      const unmatched = (data.unassigned || []).filter(p => !$("person").value || p.person === $("person").value).filter(p => !$("search").value || `${p.person} ${p.profile} ${p.filename}`.toLowerCase().includes($("search").value.toLowerCase()));
      $("unassigned").innerHTML = unmatched.length ? `<p class="muted small">Всего записей с неопределённой плашкой: ${number(data.unassigned_total)}. Не все эти видео обязательно содержат рекламу.</p><div class="table-wrap"><table><thead><tr><th>Файл</th><th>Клиент / профиль</th><th>Площадка</th><th>Дата</th><th></th></tr></thead><tbody>${unmatched.map(p => `<tr><td>${esc(p.filename)}</td><td>${esc(p.person)}<small>${esc(p.profile)}</small></td><td>${esc(platformName(p.platform))}</td><td>${date(p.published_at)}</td><td><button class="text-button" data-assign="${p.id}">Указать баннер</button></td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">Нет доступных записей.</div>';
    }
  }
  async function load() {
    try {
      const result = await readJson(isPublic ? `banner-data.json?t=${Date.now()}` : "/api/banner-analytics");
      data = result;
      if (isPublic && result.banner) data.publications.forEach(p => { p.banner = result.banner; });
      const rows = data.publications || [];
      options($("banner"), [...new Set([...(data.banners || []), ...rows.map(p => p.banner)])].filter(Boolean).sort(), "Все баннеры");
      options($("person"), [...new Set(rows.map(p => p.person))].filter(Boolean).sort(), "Все клиенты");
      const selected = new URLSearchParams(location.search).get("banner"); if (selected && [...$("banner").options].some(x => x.value === selected)) $("banner").value = selected;
      $("notice").textContent = isPublic ? `Публичный отчёт · обновлён ${date(data.generated_at)}. Показаны только опубликованные в этом отчёте данные.` : `Баннеры ищутся по папкам примеров, именам файлов и тексту на кадрах. Файлов в папках примеров: ${number(data.reference.indexed)}. Публикации без имени исходного файла автоматически связать нельзя.`;
      render();
      if (!isPublic) shareInfo = await readJson("/api/banner-analytics/share").catch(() => ({}));
    } catch (e) { $("notice").textContent = `Не удалось загрузить отчёт: ${e.message}. Если приложение только что обновлено, требуется перезапустить сервер.`; }
  }
  ["banner","person","platform","search","view-filter"].forEach(id => $(id).addEventListener("input", render));
  document.addEventListener("click", async e => {
    const card = e.target.closest("[data-banner]"); if (card) { $("banner").value = card.dataset.banner; render(); }
    const btn = e.target.closest("[data-assign]"); if (btn) { const banner = prompt("Название рекламного баннера (например CSGORUN или RubUP). Изменение применится к копиям того же ролика у этого клиента:"); if (!banner || !banner.trim()) return; try { await readJson("/api/banner-analytics/assignment", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({publication_id:Number(btn.dataset.assign),banner:banner.trim()})}); await load(); } catch (err) { alert(err.message); } }
    const remove = e.target.closest("[data-remove]"); if (remove && confirm("Убрать этот ролик и его копии из аналитики баннеров?")) { try { await readJson("/api/banner-analytics/assignment", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({publication_id:Number(remove.dataset.remove),banner:"__none__"})}); await load(); } catch (err) { alert(err.message); } }
  });
  $("toggle-unassigned").addEventListener("click", () => { $("unassigned").hidden = !$("unassigned").hidden; $("toggle-unassigned").textContent = $("unassigned").hidden ? "Показать" : "Скрыть"; });
  $("scan").addEventListener("click", async () => { try { await readJson("/api/banner-analytics/scan", {method:"POST"}); $("scan").disabled = true; const poll = setInterval(async () => { try { const s = await readJson("/api/banner-analytics/scan"); $("notice").textContent = `${s.message}: ${number(s.processed)} из ${number(s.total)} · найдено ${number(s.found)}`; if (!s.running) { clearInterval(poll); $("scan").disabled = false; await load(); } } catch (_) { clearInterval(poll); $("scan").disabled = false; } }, 3000); } catch (e) { alert(e.message); } });
  $("refresh-views").addEventListener("click", async () => { try { await readJson("/api/banner-analytics/views", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({banner:$("banner").value})}); $("refresh-views").disabled = true; const poll = setInterval(async () => { try { const s = await readJson("/api/banner-analytics/views"); $("notice").textContent = `${s.message}: ${number(s.processed)} из ${number(s.total)} · обновлено ${number(s.updated)}`; if (!s.running) { clearInterval(poll); $("refresh-views").disabled = false; await load(); alert(`Проверка завершена. Обновлено: ${number(s.updated)} из ${number(s.total)}. Для остальных ссылки или счётчики недоступны.`); } } catch (_) { clearInterval(poll); $("refresh-views").disabled = false; } }, 3000); } catch (e) { alert(e.message); } });
  $("share").addEventListener("click", async () => { if (isPublic) { await navigator.clipboard.writeText(location.href); alert("Ссылка скопирована"); return; } const b = $("banner").value; const links = shareInfo.urls || {}; const first = Object.values(links)[0]; const url = b ? links[b] : (shareInfo.base_url || (first ? new URL("../", first).href : "")); if (!url) { alert("Публичная ссылка ещё не настроена. Отчёт пока доступен только на этом компьютере."); return; } await navigator.clipboard.writeText(url); alert("Ссылка скопирована. Отчёт доступен всем, у кого есть ссылка, и через публичный GitHub."); });
  load();
})();
