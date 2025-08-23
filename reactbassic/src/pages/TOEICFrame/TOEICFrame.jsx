import React, { useEffect, useMemo, useState } from "react";
import "./TOEICFrame.css";

export default function TOEICFrame({
  mode: modeProp = "reading",
  part = 5,
  questionNo = 1,
  total = 1,
  timer = "01:45:00",
  title = "Choose the best answer.",
  data = {},
  availableModes = [modeProp],
  selected = null,            // ⬅️ single-question page
  multiSelected = null,       // ⬅️ group page: { [idx]: number }
  onSelect,                   // ⬅️ single
  onSelectAt,                 // ⬅️ group
  onModeChange,
  onBack,
  onNext,
  onFinish,
}) {
  const [mode, setMode] = useState(modeProp);
  const headerTitle = mode === "listening" ? "LISTENING" : "READING";

  const changeMode = (next) => {
    if (!availableModes.includes(next)) return;
    setMode(next);
    onModeChange?.(next);
  };

  const scrollStyle = useMemo(
    () => ({ maxHeight: "calc(100vh - 220px)", overflowY: "auto", paddingBottom: 96 }),
    []
  );

  return (
    <div className="toeic-frame">
      <div className="tf-top">
        <div className="tf-top__left">
          <div className="tf-top__title">{headerTitle}</div>
          <ModeSwitch
            value={mode}
            onChange={changeMode}
            disabledList={["listening", "reading"].filter((m) => !availableModes.includes(m))}
          />
        </div>
        <div className="tf-top__right">
          <div className="tf-top__qn">Question {questionNo} of {total}</div>
          <button className="tf-btn tf-btn--light" onClick={onFinish}>FINISH</button>
          <div className="tf-timer">{timer}</div>
        </div>
      </div>

      {/* ép remount theo trang để state cục bộ reset đúng */}
      <div className="tf-card" key={`page-${mode}-${part}-${questionNo}`}>
        <div className="tf-card__bar">{title}</div>
        <div className="tf-scroll" style={scrollStyle}>
          {renderContent(mode, part, data, { selected, multiSelected, onSelect, onSelectAt })}
        </div>
      </div>

      <div className="tf-bottom">
        <div className="tf-bottom__left">
          <label className="tf-check">
            <input type="checkbox" />
            <span>Mark items for review</span>
          </label>
        </div>
        <div className="tf-bottom__right">
          <button className="tf-btn" onClick={onBack}>BACK</button>
          <button className="tf-btn tf-btn--primary" onClick={onNext}>NEXT</button>
        </div>
      </div>
    </div>
  );
}

/* ============== render theo Part ============== */

function renderContent(mode, part, data, sel) {
  const { selected, multiSelected, onSelect, onSelectAt } = sel;

  if (mode === "listening" && part === 1) {
    return (
      <div className="tf-grid">
        <div className="tf-pane tf-pane--scroll">
          {data.image && <div className="tf-imgwrap"><img src={data.image} alt="visual" /></div>}
          {data.audio && <StickyAudio src={data.audio} />}
        </div>
        <div className="tf-pane">
          <Question text={null} options={data.options} value={selected} onChange={onSelect} />
        </div>
      </div>
    );
  }

  if (mode === "listening" && part === 2) {
    return (
      <div className="tf-pane">
        {data.audio && <StickyAudio src={data.audio} />}
        <Question text={null} options={data.options} value={selected} onChange={onSelect} />
      </div>
    );
  }

  if (mode === "listening" && (part === 3 || part === 4)) {
    return (
      <div className="tf-pane">
        {data.audio && <StickyAudio src={data.audio} />}
        {(data.group || []).map((q, i) => (
          <Question
            key={q.id || i}
            text={q.text}
            options={q.options}
            value={multiSelected?.[i] ?? null}
            onChange={(v) => onSelectAt?.(i, v)}
          />
        ))}
      </div>
    );
  }

  if (mode === "reading" && part === 5) {
    return (
      <div className="tf-pane">
        <Question text={data.text} options={data.options} value={selected} onChange={onSelect} />
      </div>
    );
  }

  if (mode === "reading" && part === 6) {
    return (
      <div className="tf-grid">
        <div className="tf-pane tf-pane--scroll">
          <div className="tf-passage">{data.passage}</div>
        </div>
        <div className="tf-pane">
          {(data.questions || []).map((q, i) => (
            <Question
              key={q.id || i}
              text={q.text}
              options={q.options}
              value={multiSelected?.[i] ?? null}
              onChange={(v) => onSelectAt?.(i, v)}
            />
          ))}
        </div>
      </div>
    );
  }

  if (mode === "reading" && part === 7) {
    return (
      <div className="tf-grid">
        <div className="tf-pane tf-pane--scroll">
          {(data.passages || []).map((p, i) => (
            <div key={i} className="tf-passage">
              {p.title && <h4>{p.title}</h4>}
              <pre>{p.content}</pre>
            </div>
          ))}
        </div>
        <div className="tf-pane">
          {(data.questions || []).map((q, i) => (
            <Question
              key={q.id || i}
              text={q.text}
              options={q.options}
              value={multiSelected?.[i] ?? null}
              onChange={(v) => onSelectAt?.(i, v)}
            />
          ))}
        </div>
      </div>
    );
  }

  return <div className="tf-pane">Unsupported part</div>;
}

/* ============== Atoms ============== */

function ModeSwitch({ value, onChange, disabledList = [] }) {
  const isDisabled = (m) => disabledList.includes(m);
  return (
    <div className="tf-modeswitch" role="tablist" aria-label="Select skill">
      <button
        role="tab"
        aria-selected={value === "listening"}
        className={`tf-chip ${value === "listening" ? "is-active" : ""}`}
        onClick={() => onChange("listening")}
        type="button"
        disabled={isDisabled("listening")}
        title={isDisabled("listening") ? "Not available in this session" : "Switch to Listening"}
      >
        Listening
      </button>
      <button
        role="tab"
        aria-selected={value === "reading"}
        className={`tf-chip ${value === "reading" ? "is-active" : ""}`}
        onClick={() => onChange("reading")}
        type="button"
        disabled={isDisabled("reading")}
        title={isDisabled("reading") ? "Not available in this session" : "Switch to Reading"}
      >
        Reading
      </button>
    </div>
  );
}

function StickyAudio({ src }) {
  if (!src) return null;
  return (
    <div
      className="tf-audio tf-audio--sticky"
      style={{ position: "sticky", top: 0, zIndex: 2, background: "#fff", padding: 12, borderRadius: 12, boxShadow: "0 1px 0 rgba(0,0,0,0.04)", marginBottom: 12 }}
    >
      <audio controls preload="none" src={src} style={{ width: "100%" }} />
    </div>
  );
}

/** Câu hỏi custom; controlled nếu có props value/onChange, ngược lại tự quản */
function Question({ text, options = [], value = null, onChange }) {
  const [selected, setSelected] = useState(value);
  useEffect(() => { setSelected(value); }, [value]);

  const pick = (i) => {
    setSelected(i);
    onChange?.(i);
  };

  const onKeyDown = (e) => {
    if (!options.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      pick(selected == null ? 0 : Math.min(options.length - 1, selected + 1));
    }
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      pick(selected == null ? 0 : Math.max(0, selected - 1));
    }
  };

  return (
    <div className="tf-question" onKeyDown={onKeyDown}>
      {text && <p className="tf-qtext">{text}</p>}
      <AnswerList options={options} selected={selected} onSelect={pick} />
    </div>
  );
}

function AnswerList({ options = [], selected, onSelect = () => { } }) {
  return (
    <ul className="tf-opts">
      {options.slice(0, 4).map((opt, i) => {
        const active = selected === i;
        return (
          <li key={i} className={`tf-opt ${active ? "is-selected" : ""}`}>
            <button type="button" className="tf-opt__btn" aria-pressed={active} onClick={() => onSelect(i)}>
              <b className="tf-opt__label">{String.fromCharCode(65 + i)}.</b>
              <span className="tf-opt__text">{opt}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
