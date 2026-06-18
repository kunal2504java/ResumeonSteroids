import Link from "next/link";
import InkLayer from "@/components/ink/InkLayer";
import InkGauge from "@/components/ink/InkGauge";

export default function LandingPage() {
  return (
    <>
      <style>{LANDING_CSS}</style>
      <InkLayer />

      {/* ---------- NAV ---------- */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-brand">
            <b>ResumeAI<span className="lp-dot">.</span></b>
            <small>resume studio</small>
          </div>
          <div className="lp-nav-links">
            <a href="#how">How it works</a>
            <a href="#sources">Sources</a>
            <a href="#inside">Inside</a>
            <Link href="/dashboard" className="btn btn-pen btn-sm">Start a draft</Link>
          </div>
        </div>
      </nav>

      <main>
        {/* ---------- HERO ---------- */}
        <section className="lp-hero">
          <div className="page-wrap lp-hero-grid">
            <div>
              <span className="eyebrow">for students &amp; job seekers — not recruiters with budgets</span>
              <h1 className="lp-h1">
                Scattered wins, into a resume that{" "}
                <span className="lp-u" data-mark="circle" data-color="pen">lands</span>.
              </h1>
              <p className="lp-lede">
                Pull from GitHub, LeetCode, or your old PDF. We mark up every weak bullet,
                flag what the ATS bots choke on, and hand you a clean draft — like a mentor
                who actually picks up the red pen.
              </p>
              <div className="lp-cta-row">
                <Link href="/dashboard" className="btn btn-pen">Start a draft <span aria-hidden="true">→</span></Link>
                <a href="#how" className="btn btn-ghost" data-mark="underline" data-color="ink">See how it reads</a>
              </div>
              <div className="lp-proof">
                <div className="lp-stat"><div className="lp-n">3&nbsp;min</div><div className="lp-l">from messy notes to a first draft</div></div>
                <div className="lp-stat"><div className="lp-n" style={{ color: "var(--pen)" }}>0</div><div className="lp-l">templates that look like everyone else&apos;s</div></div>
                <div className="lp-stat"><div className="lp-n">92<span style={{ fontSize: 18 }}>/100</span></div><div className="lp-l">median ATS score after a pass</div></div>
              </div>
            </div>

            {/* collage of pinned artifacts */}
            <div className="lp-collage">
              <div className="lp-piece lp-scrap">
                <div className="eyebrow" style={{ marginBottom: 8 }}>your stuff, everywhere</div>
                <div className="lp-src"><i style={{ background: "var(--ink)" }} />github.com/you · 41 repos</div>
                <div className="lp-src"><i style={{ background: "var(--marigold)" }} />leetcode · 380 solved</div>
                <div className="lp-src"><i style={{ background: "var(--pen)" }} />codeforces · 1640</div>
                <div className="lp-src"><i style={{ background: "var(--ink-blue)" }} />resume_final_v7.pdf</div>
              </div>

              <div className="lp-piece ink-card lp-bullet-card" data-frame>
                <span className="tab lp-bullet-tab">editor · bullet</span>
                <div className="lp-bullet-old" data-mark="strike" data-color="pen">
                  Worked on a website for a college club using React.
                </div>
                <div className="hand" style={{ fontSize: 15, marginTop: 8 }} data-mark="arrow" data-arrow-to="lp-bullet-new">
                  weak — what changed?
                </div>
                <div className="lp-bullet-new" id="lp-bullet-new">
                  Shipped a <b>club portal</b> in React used by <b>600+ members</b>, cutting event sign-up time by 70%.
                </div>
              </div>

              <div className="lp-piece sticky lp-score">
                <div className="tape" />
                <div className="lp-score-big">92</div>
                <div className="lp-score-lbl">ATS pass</div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- SOURCES ---------- */}
        <section className="section" id="sources">
          <div className="page-wrap">
            <div className="section-head">
              <span className="eyebrow">connect what you&apos;ve already done</span>
              <h2>You&apos;ve been building a resume for years.<br />It&apos;s just scattered across ten tabs.</h2>
              <p>Point us at where your work already lives. We read it, pull the evidence,
                and lay it out on one page so nothing good gets forgotten.</p>
            </div>
            <div className="lp-board">
              <div className="ink-card lp-src-card r1"><span className="tab">code</span><h4>GitHub</h4><p>repos, stars, the languages you actually ship in</p></div>
              <div className="ink-card lp-src-card r2"><span className="tab">practice</span><h4>LeetCode</h4><p>problems solved, contest rating, streaks</p></div>
              <div className="ink-card--ink lp-src-card center"><h4>Your draft</h4><p>everything, on one page</p></div>
              <div className="ink-card lp-src-card r3"><span className="tab">competitive</span><h4>Codeforces</h4><p>rating, divisions, rounds played</p></div>
              <div className="ink-card lp-src-card r4"><span className="tab">history</span><h4>Old PDF / DOCX</h4><p>we read your last resume and keep what worked</p></div>
              <div className="hand lp-board-note">all of it,<br />in one place ↑</div>
            </div>
          </div>
        </section>

        {/* ---------- HOW IT WORKS ---------- */}
        <section className="section" id="how">
          <div className="page-wrap">
            <div className="section-head">
              <span className="eyebrow">three steps, in order</span>
              <h2>Connect. Mark up. Send.</h2>
            </div>
            <div className="lp-flow">
              <div className="lp-step">
                <div className="lp-num" id="flow-1">01</div>
                <h3>Connect</h3>
                <p>Drop in a link or upload your old resume. We read your real work instead of asking you to type it all again.</p>
                <div className="hand lp-note">drag your messy notes here →</div>
              </div>
              <div className="lp-step">
                <div className="lp-num" id="flow-2">02</div>
                <h3>Mark up</h3>
                <p>We rewrite vague bullets into specifics, flag the lines ATS bots silently drop, and show you exactly what changed and why.</p>
                <div className="hand hand-blue lp-note">this is the part a friend can&apos;t do at 2am</div>
              </div>
              <div className="lp-step">
                <div className="lp-num" id="flow-3">03</div>
                <h3>Send</h3>
                <p>Export a clean, real-LaTeX PDF and track every application — so you follow up before the trail goes cold.</p>
                <div className="hand lp-note">then go get it.</div>
              </div>
            </div>
            <span data-flow="flow-1>flow-2" hidden />
            <span data-flow="flow-2>flow-3" hidden />
          </div>
        </section>

        {/* ---------- INSIDE THE APP ---------- */}
        <section className="section" id="inside">
          <div className="page-wrap">
            <div className="section-head">
              <span className="eyebrow">the same hand, on every screen</span>
              <h2>It feels like working <span className="lp-u" data-mark="underline" data-color="pen">at a desk</span>, not in a dashboard.</h2>
              <p>Here&apos;s the editor, the ATS check, and the tracker — the three places you&apos;ll actually spend time.</p>
            </div>

            <div className="lp-surfaces">
              <div className="surf" data-frame>
                <span className="surf-label">editor — rewrite a bullet</span>
                <div className="lp-rw">
                  <span className="lp-old" data-mark="strike" data-color="ink">Responsible for managing social media accounts.</span>
                  <span className="lp-arrow-line">↓ tightened · added a number · active voice</span>
                  <span className="lp-new">Grew the club&apos;s Instagram from <b>0 to 4.2k</b> in one semester with a weekly post calendar.</span>
                  <div className="lp-tone">
                    <span className="chip chip--on">concise</span>
                    <span className="chip">impact</span>
                    <span className="chip">tailor to JD</span>
                    <span className="chip">soften</span>
                  </div>
                </div>
              </div>

              <div className="surf" data-frame>
                <span className="surf-label">ATS check — readability for the bots</span>
                <div className="lp-gauge-wrap">
                  <InkGauge value={92} size={120} />
                  <div>
                    <div className="lp-pct">92</div>
                    <div className="lp-pl">of 100 · strong</div>
                  </div>
                </div>
                <div className="lp-rules">
                  <div className="lp-rule ok"><span className="m">✓</span> Single column — parses cleanly</div>
                  <div className="lp-rule ok"><span className="m">✓</span> Standard section headings</div>
                  <div className="lp-rule no"><span className="m">✕</span> Skill &quot;K8s&quot; not in job description</div>
                  <div className="lp-rule ok"><span className="m">✓</span> No text trapped in images</div>
                </div>
              </div>
            </div>

            <div className="surf lp-tracker" data-frame>
              <span className="surf-label">tracker — every application, pinned where you can see it</span>
              <div className="lp-cork">
                <div className="lp-col">
                  <h5>Applied · 6</h5>
                  <div className="lp-app s1"><span className="pin" /><div className="lp-co">Ramp</div><div className="lp-ro">New Grad SWE · 4d ago</div></div>
                  <div className="lp-app s2"><span className="pin" /><div className="lp-co">Linear</div><div className="lp-ro">Frontend Intern · 6d ago</div><div className="hand hand-blue" style={{ fontSize: 16, marginTop: 6 }}>follow up today ↩</div></div>
                </div>
                <div className="lp-col">
                  <h5>Interview · 2</h5>
                  <div className="lp-app s3"><span className="pin" /><div className="lp-co">Vercel</div><div className="lp-ro">Phone screen · Fri 2pm</div></div>
                  <div className="lp-app s1"><span className="pin" /><div className="lp-co">Notion</div><div className="lp-ro">Onsite · prep ready</div></div>
                </div>
                <div className="lp-col">
                  <h5>Offer · 1</h5>
                  <div className="lp-app offer s2"><span className="pin" /><div className="lp-co">Figma</div><div className="lp-ro">Product Eng · compare?</div></div>
                  <div className="hand" style={{ marginTop: 10, fontSize: 18 }}>you did it 🎉</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- CTA ---------- */}
        <section className="section">
          <div className="page-wrap">
            <div className="lp-cta" data-frame data-frame-color="paper">
              <h2>Stop formatting.<br />Start <span className="lp-u" data-mark="underline" data-color="marigold">applying</span>.</h2>
              <p>// free to draft · export when it&apos;s ready · no account wall</p>
              <Link href="/dashboard" className="btn btn-pen">Start a draft <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </section>

        {/* ---------- FOOTER ---------- */}
        <footer className="lp-footer">
          <div className="page-wrap lp-foot-inner">
            <div className="lp-foot-l">
              <b>ResumeAI<span style={{ color: "var(--pen)" }}>.</span></b>
              <p>A resume studio for the people doing the applying. Built for the job hunt, not for a pitch deck.</p>
            </div>
            <div className="lp-foot-cols">
              <div><span className="lp-h">product</span><Link href="/dashboard">Editor</Link><a href="#inside">ATS check</a><Link href="/tracker">Tracker</Link></div>
              <div><span className="lp-h">sources</span><a href="#sources">GitHub</a><a href="#sources">LeetCode</a><a href="#sources">Upload</a></div>
              <div><span className="lp-h">company</span><a href="#">About</a><a href="#">Privacy</a><a href="#">Contact</a></div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

const LANDING_CSS = `
.lp-nav{position:relative;z-index:6;}
.lp-nav-inner{display:flex;align-items:center;justify-content:space-between;padding:26px 28px 0;max-width:1180px;margin:0 auto;}
.lp-brand{display:flex;align-items:baseline;gap:9px;}
.lp-brand b{font-family:var(--font-bricolage),sans-serif;font-weight:800;font-size:24px;letter-spacing:-.02em;}
.lp-dot{color:var(--pen);}
.lp-brand small{font-family:var(--font-spline-mono),monospace;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-soft);}
.lp-nav-links{display:flex;align-items:center;gap:30px;}
.lp-nav-links a:not(.btn){font-family:var(--font-spline-mono),monospace;font-size:13px;color:var(--ink);text-decoration:none;}
.lp-nav-links a:not(.btn):hover{color:var(--pen);}

.lp-hero{padding:56px 0 40px;position:relative;}
.lp-hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:30px;align-items:start;}
.lp-h1{font-family:var(--font-bricolage),sans-serif;font-weight:800;font-size:clamp(40px,6.2vw,76px);line-height:.98;letter-spacing:-.03em;max-width:13ch;margin-top:18px;}
.lp-u{position:relative;white-space:nowrap;}
.lp-lede{font-size:19px;line-height:1.5;color:#36322a;max-width:46ch;margin-top:26px;}
.lp-cta-row{display:flex;align-items:center;gap:22px;margin-top:34px;flex-wrap:wrap;}
.lp-proof{margin-top:30px;display:flex;gap:26px;align-items:flex-start;flex-wrap:wrap;}
.lp-n{font-family:var(--font-bricolage),sans-serif;font-weight:800;font-size:30px;line-height:1;}
.lp-l{font-family:var(--font-spline-mono),monospace;font-size:11px;letter-spacing:.08em;color:var(--ink-soft);text-transform:uppercase;margin-top:7px;max-width:15ch;}

.lp-collage{position:relative;min-height:500px;}
.lp-piece{position:absolute;}
.lp-bullet-card{width:328px;top:0;right:0;transform:rotate(1.4deg);}
.lp-bullet-tab{position:absolute;top:-14px;left:18px;transform:rotate(-1.4deg);}
.lp-bullet-old{color:var(--ink-soft);font-size:14.5px;line-height:1.5;display:inline-block;}
.lp-bullet-new{font-size:15px;line-height:1.5;font-weight:600;margin-top:14px;}
.lp-bullet-new b{background:linear-gradient(transparent 62%, rgba(242,168,29,.7) 62%);}
.lp-score{width:152px;top:312px;right:28px;transform:rotate(-3.5deg);text-align:center;}
.lp-score-big{font-family:var(--font-bricolage),sans-serif;font-weight:800;font-size:46px;line-height:1;}
.lp-score-lbl{font-family:var(--font-spline-mono),monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;margin-top:4px;}
.lp-scrap{width:206px;top:232px;left:-8px;transform:rotate(-2deg);background:var(--sheet);padding:14px 16px;box-shadow:2px 4px 0 rgba(33,30,24,.10),8px 14px 20px rgba(33,30,24,.10);}
.lp-src{display:flex;align-items:center;gap:9px;font-family:var(--font-spline-mono),monospace;font-size:12.5px;padding:5px 0;color:#37332b;}
.lp-src i{width:8px;height:8px;display:inline-block;flex:0 0 auto;}

.lp-board{position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:26px 30px;align-items:center;}
.lp-src-card{padding:18px 20px;}
.lp-src-card .tab{position:absolute;top:-13px;left:16px;}
.lp-src-card h4{font-size:18px;font-weight:700;margin:8px 0 5px;letter-spacing:-.01em;}
.lp-src-card p{font-family:var(--font-spline-mono),monospace;font-size:12px;color:var(--ink-soft);line-height:1.5;}
.lp-src-card.r1{transform:rotate(-1.5deg);}
.lp-src-card.r2{transform:rotate(1.2deg);}
.lp-src-card.r3{transform:rotate(-.8deg);}
.lp-src-card.r4{transform:rotate(1.6deg);}
.lp-src-card.center{text-align:center;transform:rotate(.5deg);padding:26px 20px;box-shadow:3px 4px 0 rgba(33,30,24,.16),10px 16px 24px rgba(33,30,24,.12);}
.lp-src-card.center h4{color:#fff;font-size:21px;}
.lp-src-card.center p{color:#bdb9ac;}
.lp-board-note{font-size:19px;grid-column:3;text-align:center;transform:rotate(-3deg);}

.lp-flow{display:grid;grid-template-columns:repeat(3,1fr);gap:40px;position:relative;}
.lp-step{position:relative;padding-top:18px;}
.lp-num{font-family:var(--font-bricolage),sans-serif;font-weight:800;font-size:15px;color:#fff;background:var(--pen);width:38px;height:38px;display:grid;place-items:center;box-shadow:2px 3px 0 var(--ink);}
.lp-step h3{font-size:23px;font-weight:700;margin:20px 0 10px;letter-spacing:-.01em;}
.lp-step p{font-size:15.5px;line-height:1.55;color:#3a362d;}
.lp-note{margin-top:14px;font-size:15px;}

.lp-surfaces{display:grid;grid-template-columns:1.1fr .9fr;gap:30px;}
.lp-rw{font-size:15.5px;line-height:1.55;}
.lp-old{color:var(--ink-soft);display:inline;}
.lp-arrow-line{font-family:var(--font-spline-mono),monospace;font-size:12px;color:var(--pen);margin:14px 0;display:block;letter-spacing:.05em;}
.lp-new{font-weight:600;}
.lp-new b{color:var(--pen);}
.lp-tone{margin-top:18px;display:flex;gap:8px;flex-wrap:wrap;}
.lp-gauge-wrap{display:flex;gap:22px;align-items:center;}
.lp-pct{font-family:var(--font-bricolage),sans-serif;font-weight:800;font-size:44px;line-height:1;}
.lp-pl{font-family:var(--font-spline-mono),monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft);margin-top:4px;}
.lp-rules{margin-top:20px;display:grid;gap:9px;}
.lp-rule{display:flex;align-items:center;gap:11px;font-size:14px;}
.lp-rule .m{font-family:var(--font-spline-mono),monospace;font-weight:600;width:18px;}
.lp-rule.ok .m{color:#1f7a3f;}
.lp-rule.no .m{color:var(--pen);}
.lp-rule.no{color:var(--ink-soft);}

.lp-tracker{margin-top:30px;}
.lp-cork{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;}
.lp-col h5{font-family:var(--font-spline-mono),monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:14px;border-bottom:1.5px dashed var(--ink-soft);padding-bottom:8px;}
.lp-app{background:var(--sheet);padding:14px 15px;margin-bottom:16px;position:relative;box-shadow:2px 3px 0 rgba(33,30,24,.10),6px 10px 16px rgba(33,30,24,.08);}
.lp-app.s1{transform:rotate(-1.2deg);}
.lp-app.s2{transform:rotate(.9deg);}
.lp-app.s3{transform:rotate(-.6deg);}
.lp-app.offer{background:var(--marigold);}
.lp-co{font-weight:700;font-size:16px;letter-spacing:-.01em;}
.lp-ro{font-family:var(--font-spline-mono),monospace;font-size:11.5px;color:var(--ink-soft);margin-top:3px;}
.lp-app .pin{top:-5px;right:12px;}

.lp-cta{background:var(--ink);color:var(--paper);padding:64px 48px;position:relative;box-shadow:5px 7px 0 rgba(33,30,24,.18);}
.lp-cta h2{font-family:var(--font-bricolage),sans-serif;font-weight:800;font-size:clamp(30px,4.4vw,52px);letter-spacing:-.025em;line-height:1;max-width:16ch;}
.lp-cta p{font-family:var(--font-spline-mono),monospace;font-size:14px;color:#cfcbbe;margin-top:18px;letter-spacing:.03em;}
.lp-cta .btn{margin-top:30px;box-shadow:3px 4px 0 var(--paper);}
.lp-cta .btn:hover{box-shadow:5px 7px 0 var(--paper);}

.lp-footer{padding:54px 0 70px;}
.lp-foot-inner{display:flex;justify-content:space-between;align-items:flex-end;gap:30px;flex-wrap:wrap;border-top:1.5px solid var(--ink);padding-top:24px;}
.lp-foot-l{max-width:40ch;}
.lp-foot-l b{font-family:var(--font-bricolage),sans-serif;font-weight:800;font-size:20px;}
.lp-foot-l p{font-family:var(--font-spline-mono),monospace;font-size:12px;color:var(--ink-soft);margin-top:8px;line-height:1.6;}
.lp-foot-cols{display:flex;gap:48px;}
.lp-foot-cols div{display:flex;flex-direction:column;gap:9px;}
.lp-foot-cols a{font-family:var(--font-spline-mono),monospace;font-size:12.5px;color:var(--ink);text-decoration:none;}
.lp-foot-cols a:hover{color:var(--pen);}
.lp-foot-cols .lp-h{font-family:var(--font-spline-mono),monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:3px;}

@media(max-width:900px){
  .lp-hero-grid{grid-template-columns:1fr;}
  .lp-collage{min-height:520px;margin-top:20px;}
  .lp-surfaces{grid-template-columns:1fr;}
  .lp-board{grid-template-columns:repeat(2,1fr);}
  .lp-flow{grid-template-columns:1fr;gap:30px;}
  .lp-cork{grid-template-columns:1fr;}
  .lp-nav-links a:not(.btn){display:none;}
}
@media(max-width:560px){
  .lp-board{grid-template-columns:1fr;}
  .lp-cta{padding:42px 26px;}
}
`;
