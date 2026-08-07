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
import { FirstUsersLiaReportCard } from "@/components/lia/first-users-lia-report";
import { FirstUsersReportCard } from "@/components/lia/first-users-report";
import { FirstUsersReviewReportCard } from "@/components/lia/first-users-review-report";
import { LaunchDecisionReportCard } from "@/components/lia/launch-decision-report";
import { WaveReviewReportCard } from "@/components/lia/wave-review-report";
import { LiaResults } from "@/components/lia/lia-results";
import { OutcomeReportCard } from "@/components/lia/outcome-report";
import { PilotInsightReportCard } from "@/components/lia/pilot-insight-report";
import { BetaExpansionReportCard } from "@/components/lia/beta-expansion-report";
import { OpenBetaReadinessReportCard } from "@/components/lia/open-beta-readiness-report";
import { OpenBetaReportCard } from "@/components/lia/open-beta-report";
import { RetentionReportCard } from "@/components/lia/retention-report";
import { RoleGrowthReportCard } from "@/components/lia/role-growth-report";
import { UserValueFeedbackReportCard } from "@/components/lia/user-value-feedback-report";
import { PublicLaunchDecisionReportCard } from "@/components/lia/public-launch-decision-report";
import { PublicLaunchReportCard } from "@/components/lia/public-launch-report";
import { LiveLaunchReportCard } from "@/components/lia/live-launch-report";
import { GrowthReportCard } from "@/components/lia/growth-report";
import { ProjectAcquisitionReportCard } from "@/components/lia/project-acquisition-report";
import { PartnershipReportCard } from "@/components/lia/partnership-report";
import { RevenueOpportunityReportCard } from "@/components/lia/revenue-opportunity-report";
import { LiaProductionReportCard } from "@/components/lia/lia-production-report";
import { ProductFixImprovementReportCard } from "@/components/lia/product-fix-improvement-report";
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
        const firstUsersReport = message.metadata?.firstUsersReport;
        const firstUsersLiaReport = message.metadata?.firstUsersLiaReport;
        const firstUsersReviewReport = message.metadata?.firstUsersReviewReport;
        const productFixImprovementReport =
          message.metadata?.productFixImprovementReport;
        const betaExpansionReport = message.metadata?.betaExpansionReport;
        const openBetaReadinessReport =
          message.metadata?.openBetaReadinessReport;
        const openBetaReport = message.metadata?.openBetaReport;
        const retentionReport = message.metadata?.retentionReport;
        const roleGrowthReport = message.metadata?.roleGrowthReport;
        const userValueFeedbackReport =
          message.metadata?.userValueFeedbackReport;
        const publicLaunchDecisionReport =
          message.metadata?.publicLaunchDecisionReport;
        const publicLaunchReport = message.metadata?.publicLaunchReport;
        const liveLaunchReport = message.metadata?.liveLaunchReport;
        const growthReport = message.metadata?.growthReport;
        const projectAcquisitionReport =
          message.metadata?.projectAcquisitionReport;
        const partnershipReport = message.metadata?.partnershipReport;
        const revenueOpportunityReport =
          message.metadata?.revenueOpportunityReport;
        const liaProductionReport = message.metadata?.liaProductionReport;
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
            {!isUser && firstUsersReport ? (
              <FirstUsersReportCard report={firstUsersReport} />
            ) : null}
            {!isUser && firstUsersReviewReport ? (
              <FirstUsersReviewReportCard report={firstUsersReviewReport} />
            ) : null}
            {!isUser && firstUsersLiaReport ? (
              <FirstUsersLiaReportCard report={firstUsersLiaReport} />
            ) : null}
            {!isUser && productFixImprovementReport ? (
              <ProductFixImprovementReportCard
                report={productFixImprovementReport}
              />
            ) : null}
            {!isUser && betaExpansionReport ? (
              <BetaExpansionReportCard report={betaExpansionReport} />
            ) : null}
            {!isUser && openBetaReadinessReport ? (
              <OpenBetaReadinessReportCard report={openBetaReadinessReport} />
            ) : null}
            {!isUser && openBetaReport ? (
              <OpenBetaReportCard report={openBetaReport} />
            ) : null}
            {!isUser && retentionReport ? (
              <RetentionReportCard report={retentionReport} />
            ) : null}
            {!isUser && roleGrowthReport ? (
              <RoleGrowthReportCard report={roleGrowthReport} />
            ) : null}
            {!isUser && userValueFeedbackReport ? (
              <UserValueFeedbackReportCard report={userValueFeedbackReport} />
            ) : null}
            {!isUser && publicLaunchDecisionReport ? (
              <PublicLaunchDecisionReportCard
                report={publicLaunchDecisionReport}
              />
            ) : null}
            {!isUser && publicLaunchReport ? (
              <PublicLaunchReportCard report={publicLaunchReport} />
            ) : null}
            {!isUser && liveLaunchReport ? (
              <LiveLaunchReportCard report={liveLaunchReport} />
            ) : null}
            {!isUser && growthReport ? (
              <GrowthReportCard report={growthReport} />
            ) : null}
            {!isUser && projectAcquisitionReport ? (
              <ProjectAcquisitionReportCard report={projectAcquisitionReport} />
            ) : null}
            {!isUser && partnershipReport ? (
              <PartnershipReportCard report={partnershipReport} />
            ) : null}
            {!isUser && revenueOpportunityReport ? (
              <RevenueOpportunityReportCard
                report={revenueOpportunityReport}
              />
            ) : null}
            {!isUser && liaProductionReport ? (
              <LiaProductionReportCard report={liaProductionReport} />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
