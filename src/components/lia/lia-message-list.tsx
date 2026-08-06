import { BetaAnalysisReportCard } from "@/components/lia/beta-analysis-report";
import { BetaReviewReportCard } from "@/components/lia/beta-review-report";
import { BusinessAuditReportCard } from "@/components/lia/business-audit-report";
import { ClosedWaveReportCard } from "@/components/lia/closed-wave-report";
import { LaunchGoalReportCard } from "@/components/lia/launch-goal-report";
import { LaunchGuideCard } from "@/components/lia/launch-guide";
import { LaunchReadinessReportCard } from "@/components/lia/launch-readiness-report";
import { LaunchStatusReportCard } from "@/components/lia/launch-status-report";
import { EcosystemReportCard } from "@/components/lia/ecosystem-report";
import { EcosystemValueReportCard } from "@/components/lia/ecosystem-value-report";
import { LaunchDecisionReportCard } from "@/components/lia/launch-decision-report";
import { WaveReviewReportCard } from "@/components/lia/wave-review-report";
import { LiaResults } from "@/components/lia/lia-results";
import { OutcomeReportCard } from "@/components/lia/outcome-report";
import { PilotInsightReportCard } from "@/components/lia/pilot-insight-report";
import { ProductImprovementReportCard } from "@/components/lia/product-improvement-report";
import { ProgressReportCard } from "@/components/lia/progress-report";
import { StrategyReportCard } from "@/components/lia/strategy-report";
import { LiaProjectFlow } from "@/features/lia/components/lia-project-flow";
import type { LiaMessage } from "@/types/lia";
import type { CategoryRow } from "@/types/database";
import { cn } from "@/lib/utils";

type LiaMessageListProps = {
  messages: LiaMessage[];
  categories: CategoryRow[];
};

function renderContent(content: string) {
  const parts = content.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, index) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (!match) {
      return (
        <span key={index} className="whitespace-pre-wrap">
          {part}
        </span>
      );
    }
    return (
      <a
        key={index}
        href={match[2]}
        className="text-accent underline-offset-2 hover:underline"
      >
        {match[1]}
      </a>
    );
  });
}

export function LiaMessageList({ messages, categories }: LiaMessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="space-y-2 text-sm text-muted">
        <p>
          Начните со сценария ниже: создать проект, аудит, стратегия, поиск
          решений или оценка прогресса.
        </p>
        <p>
          После создания проекта откройте workspace и нажмите «Анализ Лией» —
          Лия только рекомендует и не действует без вашего подтверждения.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {messages.map((message) => {
        const isUser = message.role === "user";
        const results = message.metadata?.results || [];
        const projectDraft = message.metadata?.projectDraft;
        const auditReport = message.metadata?.businessAuditReport;
        const strategyReport = message.metadata?.strategyReport;
        const progressReport = message.metadata?.progressReport;
        const outcomeReport = message.metadata?.outcomeReport;
        const pilotInsightReport = message.metadata?.pilotInsightReport;
        const productImprovementReport =
          message.metadata?.productImprovementReport;
        const betaAnalysisReport = message.metadata?.betaAnalysisReport;
        const betaReviewReport = message.metadata?.betaReviewReport;
        const launchReadinessReport = message.metadata?.launchReadinessReport;
        const launchGuide = message.metadata?.launchGuide;
        const launchStatusReport = message.metadata?.launchStatusReport;
        const launchGoalReport = message.metadata?.launchGoalReport;
        const closedWaveReport = message.metadata?.closedWaveReport;
        const waveReviewReport = message.metadata?.waveReviewReport;
        const launchDecisionAIReport =
          message.metadata?.launchDecisionAIReport;
        const ecosystemReport = message.metadata?.ecosystemReport;
        const ecosystemValueReport = message.metadata?.ecosystemValueReport;
        const progressProjectId =
          results.find((item) => item.type === "project")?.id ?? null;

        return (
          <li
            key={message.id}
            className={cn(
              "rounded-sm border px-4 py-3",
              isUser
                ? "ml-6 border-accent/30 bg-accent-muted/40"
                : "mr-6 border-border bg-surface/70",
            )}
          >
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
              {isUser ? "Вы" : "Лия"}
            </p>
            <div className="mt-2 text-sm leading-relaxed text-foreground">
              {renderContent(message.content)}
            </div>
            {!isUser && results.length > 0 ? (
              <LiaResults results={results} />
            ) : null}
            {!isUser && projectDraft ? (
              <LiaProjectFlow draft={projectDraft} categories={categories} />
            ) : null}
            {!isUser && auditReport ? (
              <BusinessAuditReportCard report={auditReport} />
            ) : null}
            {!isUser && strategyReport ? (
              <StrategyReportCard report={strategyReport} />
            ) : null}
            {!isUser && progressReport ? (
              <ProgressReportCard
                report={progressReport}
                projectId={progressProjectId}
              />
            ) : null}
            {!isUser && outcomeReport ? (
              <OutcomeReportCard
                report={outcomeReport}
                projectId={progressProjectId}
              />
            ) : null}
            {!isUser && pilotInsightReport ? (
              <PilotInsightReportCard report={pilotInsightReport} />
            ) : null}
            {!isUser && productImprovementReport ? (
              <ProductImprovementReportCard
                report={productImprovementReport}
              />
            ) : null}
            {!isUser && betaAnalysisReport ? (
              <BetaAnalysisReportCard report={betaAnalysisReport} />
            ) : null}
            {!isUser && betaReviewReport ? (
              <BetaReviewReportCard report={betaReviewReport} />
            ) : null}
            {!isUser && launchReadinessReport ? (
              <LaunchReadinessReportCard report={launchReadinessReport} />
            ) : null}
            {!isUser && launchGuide ? (
              <LaunchGuideCard report={launchGuide} />
            ) : null}
            {!isUser && launchStatusReport ? (
              <LaunchStatusReportCard report={launchStatusReport} />
            ) : null}
            {!isUser && launchGoalReport ? (
              <LaunchGoalReportCard report={launchGoalReport} />
            ) : null}
            {!isUser && closedWaveReport ? (
              <ClosedWaveReportCard report={closedWaveReport} />
            ) : null}
            {!isUser && waveReviewReport ? (
              <WaveReviewReportCard report={waveReviewReport} />
            ) : null}
            {!isUser && launchDecisionAIReport ? (
              <LaunchDecisionReportCard report={launchDecisionAIReport} />
            ) : null}
            {!isUser && ecosystemReport ? (
              <EcosystemReportCard report={ecosystemReport} />
            ) : null}
            {!isUser && ecosystemValueReport ? (
              <EcosystemValueReportCard report={ecosystemValueReport} />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
