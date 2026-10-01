import React, { useState } from 'react';
import {
  Calendar,
  Flame,
  Target,
  TrendingUp,
  Clock,
  Award,
  CheckCircle,
  Plus,
} from 'lucide-react';
import { Project, DailyStat } from '../types/writing';
import { recordWordCount } from '../utils/storage';
import { D3VelocityChart } from './D3VelocityChart';

interface ScheduleViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  project,
  onUpdateProject,
}) => {
  const [manualWordLog, setManualWordLog] = useState('');
  const [manualMinutes, setManualMinutes] = useState('30');

  // Compute total current words in project
  let currentTotalWords = 0;
  project.books.forEach((b) => {
    b.acts.forEach((a) => {
      a.chapters.forEach((c) => {
        c.scenes.forEach((s) => {
          currentTotalWords += s.wordCount || 0;
        });
      });
    });
  });

  const targetWords = project.targetWordCount || 80000;
  const progressPercent = Math.min(100, Math.round((currentTotalWords / targetWords) * 100));
  const remainingWords = Math.max(0, targetWords - currentTotalWords);

  // Daily stats sorting
  const stats: DailyStat[] = [...(project.stats || [])].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  // Compute streak
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  const reversed = [...stats].reverse();
  for (const s of reversed) {
    if (s.wordsAdded > 0) {
      streak += 1;
    } else {
      break;
    }
  }

  // Today's words
  const todayStat = stats.find((s) => s.date === today);
  const todayWords = todayStat?.wordsAdded || 0;
  const todayGoal = project.dailyWordGoal || 1000;
  const todayGoalPercent = Math.min(100, Math.round((todayWords / todayGoal) * 100));

  // Average daily pace
  const daysWithStats = stats.filter((s) => s.wordsAdded > 0);
  const avgDailyWords =
    daysWithStats.length > 0
      ? Math.round(
          daysWithStats.reduce((sum, s) => sum + s.wordsAdded, 0) /
            daysWithStats.length
        )
      : todayGoal;

  const estimatedDaysRemaining =
    avgDailyWords > 0 ? Math.ceil(remainingWords / avgDailyWords) : 90;

  const estimatedFinishDate = new Date();
  estimatedFinishDate.setDate(estimatedFinishDate.getDate() + estimatedDaysRemaining);

  const handleLogManualSession = (e: React.FormEvent) => {
    e.preventDefault();
    const words = parseInt(manualWordLog, 10);
    const mins = parseInt(manualMinutes, 10) || 15;
    if (isNaN(words) || words <= 0) return;

    const updated = recordWordCount(project, words, mins);
    onUpdateProject(updated);
    setManualWordLog('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-y-auto p-6 space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span>Writing Velocity & Schedule</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track daily output, velocity, streaks, and milestone deadlines for {project.title}.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Target Deadline:</span>
          <span className="font-semibold text-foreground">
            {project.deadline
              ? new Date(project.deadline).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Dec 15, 2026'}
          </span>
        </div>
      </div>

      {/* Hero Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Progress */}
        <div className="p-4 bg-card border border-border/80 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Manuscript Progress</span>
            <Target className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {currentTotalWords.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">
              / {targetWords.toLocaleString()} words
            </span>
          </div>
          <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden mt-1">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-[11px] text-muted-foreground flex justify-between">
            <span>{progressPercent}% Complete</span>
            <span>{remainingWords.toLocaleString()} words left</span>
          </div>
        </div>

        {/* Today's Goal */}
        <div className="p-4 bg-card border border-border/80 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Today's Word Goal</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {todayWords.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">
              / {todayGoal.toLocaleString()} words
            </span>
          </div>
          <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden mt-1">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${todayGoalPercent}%` }}
            />
          </div>
          <div className="text-[11px] text-muted-foreground">
            {todayGoalPercent >= 100
              ? 'Goal completed for today!'
              : `${todayGoal - todayWords} words to reach daily goal`}
          </div>
        </div>

        {/* Writing Streak */}
        <div className="p-4 bg-card border border-border/80 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Current Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-amber-500 tabular-nums">
              {streak}
            </span>
            <span className="text-xs text-muted-foreground">consecutive days</span>
          </div>
          <div className="text-[11px] text-muted-foreground pt-1">
            Keep writing daily to maintain narrative momentum.
          </div>
        </div>

        {/* Completion Forecast */}
        <div className="p-4 bg-card border border-border/80 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Projected Completion</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-lg font-bold tracking-tight text-foreground">
            {estimatedFinishDate.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Based on ~{avgDailyWords.toLocaleString()} words/day velocity ({estimatedDaysRemaining} days remaining).
          </div>
        </div>
      </div>

      {/* D3 30-Day Velocity & Target Analysis Line Chart */}
      <D3VelocityChart project={project} />

      {/* Velocity Bar Chart & Recent History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Daily Output Chart */}
        <div className="lg:col-span-2 p-5 bg-card border border-border/80 rounded-xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">
              Recent Writing Velocity (Last 7 Days)
            </h3>
            <span className="text-xs text-muted-foreground font-mono">words added</span>
          </div>

          <div className="h-48 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-border/40">
            {stats.slice(-7).map((stat) => {
              const maxWords = Math.max(2000, ...stats.map((s) => s.wordsAdded));
              const barHeightPercent = Math.min(100, Math.max(10, Math.round((stat.wordsAdded / maxWords) * 100)));
              const isToday = stat.date === today;

              return (
                <div key={stat.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] text-muted-foreground font-mono tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                    {stat.wordsAdded}w
                  </span>
                  <div
                    className={`w-full max-w-[42px] rounded-t-md transition-all duration-300 ${
                      isToday ? 'bg-primary' : 'bg-primary/40 group-hover:bg-primary/70'
                    }`}
                    style={{ height: `${barHeightPercent}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {stat.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Average: {avgDailyWords.toLocaleString()} words/session</span>
            <span>Target: {todayGoal.toLocaleString()} words/day</span>
          </div>
        </div>

        {/* Quick Log Session */}
        <div className="p-5 bg-card border border-border/80 rounded-xl shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              <span>Log Manual Writing Session</span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Did you write offline in a notebook or on another device? Log your word count here.
            </p>
          </div>

          <form onSubmit={handleLogManualSession} className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">
                Words Added
              </label>
              <input
                type="number"
                value={manualWordLog}
                onChange={(e) => setManualWordLog(e.target.value)}
                placeholder="e.g. 750"
                className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground">
                Session Minutes
              </label>
              <input
                type="number"
                value={manualMinutes}
                onChange={(e) => setManualMinutes(e.target.value)}
                placeholder="45"
                className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={!manualWordLog}
              className="w-full py-2 px-3 rounded-md bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              Add to Daily Statistics
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
