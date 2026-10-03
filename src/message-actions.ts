/**
 * 過去の発言を「これを読んで」と指定するための小さなボタンを、
 * 各回答と各質問へ差し込む。
 *
 * Claude 側の DOM はできるだけ触らない。
 * - 追加するのは自前の属性を持つ <button> 1つだけ
 * - スタイルは自前の <style> を head へ 1回入れるだけで、
 *   Claude のクラスや既存要素には一切手を入れない
 * - position を触るのは、その要素が static のときだけ
 *
 * ボタンは発言の「上の空き」に出す。本文の上に重ねると、1行目の文字と被って読めなくなるため。
 * 回答は左寄せ・質問は右寄せなので、回答のボタンは左上、質問のボタンは右上に置く。
 * こうすると Claude 自身のボタン列（回答は左下、質問は右下）とも重ならない。
 */

export type ReadButtonKind = 'answer' | 'question';

const BTN_ATTR = 'data-cvb-read-btn';
const MARK_ATTR = 'data-cvb-actions';
const STYLE_ID = 'cvb-actions-style';

const LABELS: Record<ReadButtonKind, string> = {
  answer: '🔊 この回答を読む',
  question: '🔊 この質問を読む',
};

const CSS = `
[${BTN_ATTR}] {
  position: absolute; top: -24px; z-index: 50;
  box-sizing: border-box; height: 22px; padding: 0 8px;
  display: inline-flex; align-items: center; white-space: nowrap;
  font: 11px/1 -apple-system, "Hiragino Sans", sans-serif;
  border-radius: 999px; cursor: pointer;
  border: 1px solid rgba(128,128,128,.45);
  background: rgba(127,127,127,.15); color: inherit;
  opacity: 0; transition: opacity .12s ease;
}
[${BTN_ATTR}="answer"] { left: 0; }
[${BTN_ATTR}="question"] { right: 0; }
/* ボタンは発言の枠の外にあるので、発言からボタンへマウスを動かす途中で消えないよう隙間を埋める */
[${BTN_ATTR}]::after { content: ""; position: absolute; left: 0; right: 0; top: 100%; height: 4px; }
[${MARK_ATTR}]:hover > [${BTN_ATTR}],
[${BTN_ATTR}]:focus-visible { opacity: 1; }
[${BTN_ATTR}]:hover { background: rgba(34,197,94,.25); border-color: rgba(34,197,94,.7); }
`;

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

/**
 * 発言それぞれへ読み上げボタンを用意する（既にあるものは触らない）。
 * 毎 tick 呼ばれるので冪等であること。
 */
export function syncReadButtons(
  turns: HTMLElement[],
  kind: ReadButtonKind,
  onRead: (turn: HTMLElement) => void,
): void {
  ensureStyle();
  for (const turn of turns) {
    // 印だけ残ってボタンが消えていることがある（Claude 側の再描画）。ボタンの有無で判断する。
    if (turn.querySelector(`:scope > [${BTN_ATTR}]`)) continue;
    turn.setAttribute(MARK_ATTR, '');

    if (getComputedStyle(turn).position === 'static') turn.style.position = 'relative';

    const btn = document.createElement('button');
    btn.setAttribute(BTN_ATTR, kind);
    btn.type = 'button';
    btn.textContent = LABELS[kind];
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onRead(turn);
    });
    turn.appendChild(btn);
  }
}

/** 差し込んだものを全部取り除く（読み上げ OFF 時など） */
export function removeReadButtons(): void {
  document.querySelectorAll(`[${BTN_ATTR}]`).forEach((b) => b.remove());
  document.querySelectorAll(`[${MARK_ATTR}]`).forEach((t) => t.removeAttribute(MARK_ATTR));
}

/** 現在マウスで選択されている範囲を、要素ごと取り出す */
export function getSelectionFragment(): DocumentFragment | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
  return sel.getRangeAt(0).cloneContents();
}
