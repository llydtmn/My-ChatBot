export default function IntroPage({ hidden, onEnter }) {
  return (
    <div id="intro-screen" className={hidden ? "hidden" : ""}>
      <div className="intro-grain"></div>
      <div className="intro-content">
        <div className="intro-badge">Personal AI Companion</div>
        <h1 className="intro-name">Lloyd<br /><em>Bot</em></h1>
        <div className="intro-divider"></div>
        <p className="intro-desc">
          Meet <strong>Llyd-Bot</strong> — an intelligent assistant built to answer anything about John Lloyd. His skills, experience, personality, and how to reach him. All in one conversation.
        </p>
        <button className="intro-enter-btn" onClick={onEnter}>
          <i className="fas fa-arrow-right"></i>
        </button>
      </div>
      <div className="intro-footer">lloyd.design &nbsp;·&nbsp; bsit student &nbsp;·&nbsp; open to work</div>
    </div>
  );
}
