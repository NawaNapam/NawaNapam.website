import { Flame, Award, CalendarDays, Share2 } from "lucide-react";

const STEPS = [
  {
    title: "Show up daily",
    desc: "Every day you're active — chatting or just checking in — your streak ticks up. Miss a day and it resets, unless you've earned a freeze.",
    icon: Flame,
  },
  {
    title: "Earn XP as you go",
    desc: "Completed conversations, a verified profile, and daily logins all add XP, which builds your NM tier from Explorer up to Legend.",
    icon: Award,
  },
  {
    title: "Watch your activity map fill in",
    desc: "A GitHub-style heatmap on your dashboard shows every active day at a glance, so your progress is never just a number.",
    icon: CalendarDays,
  },
  {
    title: "Hit 10, 50, or 100 days",
    desc: "Cross a milestone streak and get a shareable badge with your stats, ready to post to your story in one tap.",
    icon: Share2,
  },
];

export default function HowStreaksWork() {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 pb-section py-9">
      <div className="container mx-auto">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-medium text-foreground mb-4">
            Built to keep you coming back
          </h2>
          <p className="text-body text-lg">
            A simple streak and XP system that rewards showing up — no
            leaderboard pressure, just your own progress.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {STEPS.map((step, i) => (
            <article
              key={step.title}
              className="bg-card rounded-md border border-border p-6 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-md border border-border shrink-0">
                  <step.icon size={20} className="text-signature-coral" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  Step {i + 1}
                </span>
              </div>
              <h3 className="font-medium text-foreground">{step.title}</h3>
              <p className="text-sm text-body leading-relaxed">{step.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
