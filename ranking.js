// ヘリde破壊 公開版の追加分：世界ランキング＋寄付ボタン
// ゲーム本体（assets/game.js）は一切変更していない。
// ランキングの保存先は config.js の window.RANKING_API_URL。
(function () {
  var BOOTH_URL = "https://heridehakai.booth.pm/items/9184482";
  var NICK_KEY = "heride-nickname";
  var API = (window.RANKING_API_URL || "").replace(/\/+$/, "");
  var lastSubmittedId = null;

  var CSS = [
    ".rk-overlay{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(3,5,4,.72);}",
    ".rk-panel{background:rgba(9,13,11,.97);border:1px solid rgba(255,255,255,.16);border-top:3px solid #ffb02e;border-radius:.6rem;max-width:26rem;width:100%;max-height:calc(100dvh - 2rem);display:flex;flex-direction:column;padding:1rem 1.1rem 1.1rem;color:#f2f4f1;}",
    ".rk-panel h2{margin:0;font-size:1.25rem;font-weight:900;}",
    ".rk-sub{font-size:.75rem;color:#b9c2bb;margin:.3rem 0 .6rem;line-height:1.5;}",
    ".rk-list{overflow:auto;flex:1 1 auto;}",
    ".rk-row{display:flex;align-items:baseline;gap:.6rem;padding:.5rem .45rem;border-bottom:1px solid rgba(255,255,255,.09);}",
    ".rk-row.mine{background:rgba(255,176,46,.13);border-radius:.4rem;}",
    ".rk-rank{flex:0 0 2.2rem;font-weight:800;color:#b9c2bb;text-align:right;}",
    ".rk-row.top .rk-rank{color:#ffb02e;font-size:1.1rem;}",
    ".rk-main{flex:1 1 auto;min-width:0;}",
    ".rk-name{font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
    ".rk-meta{font-size:.68rem;color:#b9c2bb;margin-top:.1rem;}",
    ".rk-score{font-weight:800;color:#ffb02e;white-space:nowrap;}",
    ".rk-empty{text-align:center;color:#b9c2bb;font-size:.85rem;line-height:1.7;padding:1.2rem .5rem;}",
    ".rk-form{margin-top:.7rem;border-top:1px solid rgba(255,255,255,.16);padding-top:.7rem;}",
    ".rk-form label{display:block;font-size:.72rem;font-weight:700;color:#b9c2bb;margin-bottom:.35rem;}",
    ".rk-nickrow{display:flex;gap:.5rem;}",
    ".rk-nick{flex:1 1 auto;min-width:0;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.25);border-radius:.5rem;color:#f2f4f1;padding:.6rem .7rem;font-size:1rem;}",
    ".rk-reg{flex:0 0 auto;padding:.6rem .9rem;font-size:.9rem;font-weight:900;background:#ffb02e;color:#191104;border:none;border-radius:.5rem;cursor:pointer;}",
    ".rk-reg:disabled{opacity:.45;}",
    ".rk-done{margin-top:.7rem;border-top:1px solid rgba(255,255,255,.16);padding-top:.7rem;text-align:center;color:#57d977;font-weight:800;font-size:.9rem;line-height:1.6;}",
    ".rk-err{font-size:.75rem;color:#ff8a70;margin-top:.4rem;}",
    ".rk-note{font-size:.72rem;color:#b9c2bb;text-align:center;margin-top:.55rem;line-height:1.5;}",
    ".rk-close{margin-top:.8rem;}"
  ].join("\n");

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function parseNum(t) { var n = Number(String(t).replace(/[^0-9]/g, "")); return isFinite(n) ? n : 0; }
  function fmtDate(iso) {
    var d = new Date(iso); if (isNaN(d.getTime())) return "";
    return (d.getMonth() + 1) + "/" + d.getDate();
  }

  function openRanking() {
    closeRanking();
    var overlay = document.createElement("div");
    overlay.className = "rk-overlay"; overlay.id = "rkOverlay";
    overlay.innerHTML =
      '<div class="rk-panel">' +
      "<h2>🌍 世界ランキング</h2>" +
      '<p class="rk-sub">全ステージ総合・スコア順。帰還成功した記録だけが登録できます。</p>' +
      '<div class="rk-list" id="rkList"><p class="rk-empty">読み込み中…</p></div>' +
      '<button type="button" class="subbtn rk-close" id="rkClose">閉じる</button>' +
      "</div>";
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeRanking(); });
    document.body.appendChild(overlay);
    document.getElementById("rkClose").addEventListener("click", closeRanking);

    var list = document.getElementById("rkList");
    if (!API) {
      list.innerHTML = '<p class="rk-empty">ランキングサーバーが未設定です。<br>config.js にサーバーのURLを入れてね。</p>';
      return;
    }
    fetch(API + "/api/ranking?limit=100")
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        if (!data.entries || data.entries.length === 0) {
          list.innerHTML = '<p class="rk-empty">まだ記録がありません。<br>最初の記録を登録しよう！</p>';
          return;
        }
        var html = "";
        data.entries.forEach(function (e, i) {
          html += '<div class="rk-row' + (i < 3 ? " top" : "") + (e.id === lastSubmittedId ? " mine" : "") + '">' +
            '<div class="rk-rank">' + (i + 1) + "位</div>" +
            '<div class="rk-main"><div class="rk-name">' + esc(e.nickname) + "</div>" +
            '<div class="rk-meta">' + esc(e.stage) + " ／ 被害 ¥" + Number(e.yen).toLocaleString("ja-JP") + " ／ " + fmtDate(e.created_at) + "</div></div>" +
            '<div class="rk-score">' + Number(e.score).toLocaleString("ja-JP") + "</div></div>";
        });
        list.innerHTML = html;
      })
      .catch(function () {
        list.innerHTML = '<p class="rk-empty">ランキングを読み込めませんでした。<br>通信環境を確認して、もう一度開いてね。</p>';
      });
  }
  function closeRanking() {
    var o = document.getElementById("rkOverlay");
    if (o) o.remove();
  }

  function attach() {
    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    // タイトル画面にランキングボタン
    var startCard = document.querySelector("#startScreen .card");
    if (startCard) {
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = "subbtn"; btn.textContent = "🌍 世界ランキング";
      btn.addEventListener("click", openRanking);
      startCard.appendChild(btn);
    }

    // 結果画面に登録フォーム＋ランキング＋寄付ボタン
    var resultScreen = document.getElementById("resultScreen");
    var resultCard = document.querySelector("#resultScreen .card");
    if (!resultCard) return;

    var wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="rk-form" id="rkForm" style="display:none">' +
      "<label for=\"rkNickname\">ニックネームを登録して世界ランキングに載せる</label>" +
      '<div class="rk-nickrow">' +
      '<input id="rkNickname" class="rk-nick" placeholder="例：ヘリマスター" maxlength="12" autocomplete="off">' +
      '<button type="button" class="rk-reg" id="rkRegister">登録</button>' +
      "</div>" +
      '<div class="rk-err" id="rkError" style="display:none"></div>' +
      "</div>" +
      '<div class="rk-done" id="rkDone" style="display:none"></div>' +
      '<p class="rk-note" id="rkNote" style="display:none">ランキング登録は、時間内に帰還成功した時だけできます</p>' +
      '<button type="button" class="subbtn" id="rkOpen">🌍 世界ランキング</button>' +
      '<a class="subbtn" style="display:block;text-align:center;text-decoration:none;border-color:rgba(255,122,168,.65);color:#ffb3cd" href="' + BOOTH_URL + '" target="_blank" rel="noreferrer">💝 寄付お願いします！（BOOTHで応援する）</a>';
    resultCard.appendChild(wrap);

    var form = document.getElementById("rkForm");
    var done = document.getElementById("rkDone");
    var note = document.getElementById("rkNote");
    var errBox = document.getElementById("rkError");
    var input = document.getElementById("rkNickname");
    var regBtn = document.getElementById("rkRegister");
    document.getElementById("rkOpen").addEventListener("click", openRanking);
    try { input.value = localStorage.getItem(NICK_KEY) || ""; } catch (e) {}

    var current = null, submittedKey = "", submittedRank = 0, submittedTotal = 0;
    function showError(t) { errBox.textContent = t; errBox.style.display = t ? "block" : "none"; }
    function update() {
      if (!current) return;
      var key = current.score + "|" + current.yen + "|" + current.stage;
      var isDone = submittedKey === key;
      form.style.display = current.landed && !isDone ? "block" : "none";
      note.style.display = current.landed ? "none" : "block";
      done.style.display = current.landed && isDone ? "block" : "none";
      if (current.landed && isDone) {
        done.innerHTML = "🌍 世界ランキング " + submittedRank + "位 ／ " + submittedTotal + "件中" +
          '<br><span style="font-size:.75rem;color:#b9c2bb">この記録は登録済みです</span>';
      }
    }
    regBtn.addEventListener("click", function () {
      if (!current) return;
      var name = input.value.replace(/^\s+|\s+$/g, "");
      if (!name) { showError("ニックネームを入力してね"); return; }
      if (!API) { showError("ランキングサーバーが未設定です。config.js にURLを入れてね。"); return; }
      showError("");
      regBtn.disabled = true; regBtn.textContent = "登録中…";
      var run = current;
      fetch(API + "/api/ranking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: name, score: run.score, yen: run.yen, stage: run.stage })
      })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (data) {
          submittedKey = run.score + "|" + run.yen + "|" + run.stage;
          submittedRank = data.rank; submittedTotal = data.total; lastSubmittedId = data.id;
          try { localStorage.setItem(NICK_KEY, name); } catch (e) {}
          update();
        })
        .catch(function () { showError("登録に失敗しました。通信環境を確認してもう一度試してね。"); })
        .then(function () { regBtn.disabled = false; regBtn.textContent = "登録"; });
    });

    function check() {
      if (resultScreen.classList.contains("hidden")) return;
      var outcomeEl = document.getElementById("rOutcome");
      current = {
        landed: outcomeEl && outcomeEl.textContent.replace(/\s/g, "") === "帰還成功",
        score: parseNum(document.getElementById("rScore").textContent || "0"),
        yen: parseNum(document.getElementById("rYen").textContent || "0"),
        stage: (document.getElementById("rStage").textContent || "").replace(/^\s+|\s+$/g, "")
      };
      update();
    }
    new MutationObserver(check).observe(resultScreen, { attributes: true, attributeFilter: ["class"] });
    check();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", attach);
  else attach();
})();
