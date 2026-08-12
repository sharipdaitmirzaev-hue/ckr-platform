"use client";

import type { CkrRequestStatus, CkrRequestType } from "@/config/ckr-inbox";
import { addCkrRequestCommentAction } from "@/features/ckr-inbox/actions";
import {
  applyOwnerScenarioAction,
  updateNextStepPublicAction,
  updatePublicActivityAction,
  type OwnerClientControlState,
} from "@/features/ckr-inbox/owner-client-control-actions";
import {
  CLIENT_MESSAGE_TEMPLATES,
  NEXT_STEP_PUBLIC_MAX_LEN,
  NEXT_STEP_TEMPLATES,
  OWNER_SCENARIOS,
  PUBLIC_ACTIVITY_MAX_LEN,
  PUBLIC_ACTIVITY_TEMPLATES,
  buildClientFacingPreview,
  describeScenarioChanges,
  waitingClientNeedsNextStepWarning,
  type OwnerScenarioId,
} from "@/lib/ckr-inbox/owner-client-control";
import { useMemo, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";

type Props = {
  requestId: string;
  status: CkrRequestStatus;
  requestType: CkrRequestType;
  organizationName?: string | null;
  publicActivityText: string;
  nextStepPublic: string;
  lastClientMessage: string;
};

const initial: OwnerClientControlState = {};

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-sm bg-accent px-3 py-2 text-sm text-white disabled:opacity-60"
    >
      {pending ? "Сохранение…" : label}
    </button>
  );
}

function PreviewBlock({
  title,
  preview,
}: {
  title: string;
  preview: ReturnType<typeof buildClientFacingPreview>;
}) {
  return (
    <div className="space-y-2 rounded-sm border border-accent/40 bg-accent/5 p-4">
      <h3 className="font-display text-base text-foreground">{title}</h3>
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="text-muted">Статус</dt>
          <dd className="text-foreground">«{preview.statusLabel}»</dd>
        </div>
        <div>
          <dt className="text-muted">
            Сейчас ЦКР{" "}
            <span className="text-xs">
              ({preview.ckrNowMode === "CUSTOM" ? "CUSTOM" : "AUTO"})
            </span>
          </dt>
          <dd className="text-foreground">«{preview.ckrNow}»</dd>
        </div>
        <div>
          <dt className="text-muted">Что нужно от вас</dt>
          <dd className="text-foreground">«{preview.whatYouNeed}»</dd>
        </div>
        <div>
          <dt className="text-muted">Последнее сообщение</dt>
          <dd className="whitespace-pre-wrap text-foreground">
            «{preview.lastClientMessage}»
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function OwnerClientCabinetPanel({
  requestId,
  status,
  requestType,
  organizationName,
  publicActivityText,
  nextStepPublic,
  lastClientMessage,
}: Props) {
  const [activityMode, setActivityMode] = useState<"AUTO" | "CUSTOM">(
    publicActivityText.trim() ? "CUSTOM" : "AUTO",
  );
  const [activityDraft, setActivityDraft] = useState(publicActivityText);
  const [nextStepDraft, setNextStepDraft] = useState(nextStepPublic);
  const [statusDraft] = useState(status);
  const [scenarioId, setScenarioId] = useState<OwnerScenarioId | "">("");
  const [scenarioNextStep, setScenarioNextStep] = useState(nextStepPublic);
  const [clientMsgDraft, setClientMsgDraft] = useState("");
  const [clientMsgKey, setClientMsgKey] = useState(0);
  const [, startTransition] = useTransition();

  function fillClientMessage(text: string) {
    setClientMsgDraft(text);
    setClientMsgKey((k) => k + 1);
  }

  const [activityState, activityAction] = useFormState(
    updatePublicActivityAction,
    initial,
  );
  const [nextState, nextAction] = useFormState(
    updateNextStepPublicAction,
    initial,
  );
  const [scenarioState, scenarioAction] = useFormState(
    applyOwnerScenarioAction,
    initial,
  );

  const livePreview = useMemo(
    () =>
      buildClientFacingPreview({
        status: statusDraft,
        requestType,
        organizationName,
        publicActivityText: activityMode === "CUSTOM" ? activityDraft : "",
        nextStepPublic: nextStepDraft,
        lastClientMessage:
          clientMsgDraft.trim() || lastClientMessage || undefined,
      }),
    [
      statusDraft,
      requestType,
      organizationName,
      activityMode,
      activityDraft,
      nextStepDraft,
      clientMsgDraft,
      lastClientMessage,
    ],
  );

  const savedPreview = useMemo(
    () =>
      buildClientFacingPreview({
        status,
        requestType,
        organizationName,
        publicActivityText,
        nextStepPublic,
        lastClientMessage,
      }),
    [
      status,
      requestType,
      organizationName,
      publicActivityText,
      nextStepPublic,
      lastClientMessage,
    ],
  );

  const waitingWarning = waitingClientNeedsNextStepWarning({
    status,
    nextStepPublic: nextStepDraft,
  });

  const scenario = OWNER_SCENARIOS.find((s) => s.id === scenarioId);
  const scenarioLines = scenario
    ? describeScenarioChanges(
        scenario,
        {
          status,
          publicActivityText,
          nextStepPublic,
        },
        scenarioNextStep,
      )
    : [];

  return (
    <section className="space-y-6 rounded-sm border border-border p-4 sm:p-5">
      <div>
        <h2 className="font-display text-lg">Что видит клиент</h2>
        <p className="mt-1 text-sm text-muted">
          Рабочее место сотрудника: статус, «Сейчас ЦКР», что нужно от клиента и
          сообщение — без входа в клиентский аккаунт.
        </p>
      </div>

      <PreviewBlock title="Сейчас в кабинете" preview={savedPreview} />
      <PreviewBlock
        title="Сейчас клиент увидит (черновик до сохранения)"
        preview={livePreview}
      />

      {waitingWarning ? (
        <p className="rounded-sm border border-amber-600/40 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
          Вы указали, что ждёте клиента, но не написали, что именно требуется.
        </p>
      ) : null}

      {/* Сейчас ЦКР */}
      <div className="space-y-3 border-t border-border pt-4">
        <h3 className="font-display text-base">Сейчас ЦКР</h3>
        <div className="flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="activityModeUi"
              checked={activityMode === "AUTO"}
              onChange={() => {
                setActivityMode("AUTO");
                setActivityDraft("");
              }}
            />
            AUTO (по типу и статусу)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="activityModeUi"
              checked={activityMode === "CUSTOM"}
              onChange={() => setActivityMode("CUSTOM")}
            />
            CUSTOM (свой текст)
          </label>
        </div>
        {activityMode === "CUSTOM" ? (
          <>
            <textarea
              value={activityDraft}
              onChange={(e) => setActivityDraft(e.target.value)}
              rows={3}
              maxLength={PUBLIC_ACTIVITY_MAX_LEN}
              className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
              placeholder="Например: ЦКР проверяет доступные меры господдержки…"
            />
            <p className="text-xs text-muted">
              {activityDraft.length}/{PUBLIC_ACTIVITY_MAX_LEN} · без HTML
            </p>
            <div className="flex flex-wrap gap-2">
              {PUBLIC_ACTIVITY_TEMPLATES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setActivityMode("CUSTOM");
                    setActivityDraft(t);
                  }}
                  className="rounded-sm border border-border px-2 py-1 text-xs text-muted hover:text-foreground"
                >
                  {t}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">
            Будет показано: «{livePreview.ckrNow}» (AUTO по типу и статусу;
            CUSTOM сбрасывается при сохранении).
          </p>
        )}
        <form action={activityAction} className="space-y-2">
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="activityMode" value={activityMode} />
          <input
            type="hidden"
            name="publicActivityText"
            value={activityMode === "CUSTOM" ? activityDraft : ""}
          />
          <SaveButton label="Сохранить «Сейчас ЦКР»" />
          {activityState.error ? (
            <p className="text-sm text-red-600">{activityState.error}</p>
          ) : null}
          {activityState.success ? (
            <p className="text-sm text-accent">{activityState.success}</p>
          ) : null}
        </form>
      </div>

      {/* Что нужно от клиента */}
      <div className="space-y-3 border-t border-border pt-4">
        <h3 className="font-display text-base">Что нужно от клиента</h3>
        <p className="text-xs text-muted">
          Управляет полем next_step_public в кабинете клиента.
        </p>
        <textarea
          value={nextStepDraft}
          onChange={(e) => setNextStepDraft(e.target.value)}
          rows={3}
          maxLength={NEXT_STEP_PUBLIC_MAX_LEN}
          className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
          placeholder="Уточните предполагаемый бюджет проекта."
        />
        <p className="text-xs text-muted">
          {nextStepDraft.length}/{NEXT_STEP_PUBLIC_MAX_LEN}
        </p>
        <div className="flex flex-wrap gap-2">
          {NEXT_STEP_TEMPLATES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setNextStepDraft(t)}
              className="rounded-sm border border-border px-2 py-1 text-xs text-muted hover:text-foreground"
            >
              {t}
            </button>
          ))}
        </div>
        <form action={nextAction} className="space-y-3">
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="nextStepPublic" value={nextStepDraft} />
          <input type="hidden" name="clearNextStep" value="0" />
          {nextStepDraft.trim() ? (
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="setWaitingClient" className="mt-1" />
              <span>
                Перевести статус в «Ждём клиента»? (только с подтверждением;
                статус сам не меняется)
              </span>
            </label>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <SaveButton label="Сохранить" />
          </div>
          {nextState.error ? (
            <p className="text-sm text-red-600">{nextState.error}</p>
          ) : null}
          {nextState.success ? (
            <p className="text-sm text-accent">{nextState.success}</p>
          ) : null}
          {nextState.warning ? (
            <p className="text-sm text-amber-700">{nextState.warning}</p>
          ) : null}
        </form>
        <form
          action={nextAction}
          onSubmit={() => {
            startTransition(() => setNextStepDraft(""));
          }}
        >
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="nextStepPublic" value="" />
          <input type="hidden" name="clearNextStep" value="1" />
          <button
            type="submit"
            className="rounded-sm border border-border px-3 py-2 text-sm"
          >
            От клиента ничего не требуется
          </button>
        </form>
      </div>

      {/* Быстрые сценарии */}
      <div className="space-y-3 border-t border-border pt-4">
        <h3 className="font-display text-base">Быстрые сценарии</h3>
        <p className="text-xs text-muted">
          Удобство UI, не workflow engine. Перед применением — превью изменений.
        </p>
        <div className="flex flex-wrap gap-2">
          {OWNER_SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setScenarioId(s.id)}
              className={`rounded-sm border px-3 py-1.5 text-sm ${
                scenarioId === s.id
                  ? "border-accent text-accent"
                  : "border-border text-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        {scenario ? (
          <form action={scenarioAction} className="space-y-3">
            <input type="hidden" name="requestId" value={requestId} />
            <input type="hidden" name="scenarioId" value={scenario.id} />
            <p className="text-sm text-muted">{scenario.description}</p>
            <ul className="list-inside list-disc text-sm text-foreground">
              {scenarioLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            {scenario.id === "need_info" ? (
              <textarea
                name="scenarioNextStep"
                value={scenarioNextStep}
                onChange={(e) => setScenarioNextStep(e.target.value)}
                rows={2}
                required
                className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
                placeholder="Что именно нужно от клиента?"
              />
            ) : null}
            {scenario.clientMessage ? (
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  name="sendClientMessage"
                  defaultChecked
                  className="mt-1"
                />
                <span>
                  Отправить CLIENT message: «{scenario.clientMessage}» (только
                  после явного применения)
                </span>
              </label>
            ) : null}
            <label className="flex items-start gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="confirmScenario"
                required
                className="mt-1"
              />
              <span>Подтверждаю изменения выше</span>
            </label>
            <SaveButton label={`Применить: ${scenario.label}`} />
            {scenarioState.error ? (
              <p className="text-sm text-red-600">{scenarioState.error}</p>
            ) : null}
            {scenarioState.success ? (
              <p className="text-sm text-accent">{scenarioState.success}</p>
            ) : null}
          </form>
        ) : null}
      </div>

      {/* Клиент увидит — сообщение */}
      <div className="space-y-3 border-t border-border pt-4">
        <div className="rounded-sm border-2 border-accent/50 bg-accent/5 p-4 space-y-3">
          <h3 className="font-display text-base">Клиент увидит</h3>
          <p className="text-xs font-medium text-accent">
            Это увидит клиент. Не путать с внутренней заметкой ЦКР.
          </p>
          <div className="flex flex-wrap gap-2">
            {CLIENT_MESSAGE_TEMPLATES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => fillClientMessage(t)}
                className="rounded-sm border border-border bg-surface px-2 py-1 text-xs text-muted hover:text-foreground"
              >
                {t}
              </button>
            ))}
          </div>
          <form action={addCkrRequestCommentAction} className="space-y-2">
            <input type="hidden" name="requestId" value={requestId} />
            <input type="hidden" name="visibility" value="CLIENT" />
            <textarea
              name="body"
              key={clientMsgKey}
              defaultValue={clientMsgDraft}
              rows={3}
              required
              className="w-full rounded-sm border border-accent/40 bg-surface px-3 py-2 text-sm"
              placeholder="Сообщение заявителю"
              onChange={(e) => setClientMsgDraft(e.target.value)}
            />
            <button
              type="submit"
              className="rounded-sm bg-accent px-3 py-2 text-sm text-white"
            >
              Отправить клиенту
            </button>
          </form>
        </div>

        <div className="rounded-sm border border-dashed border-border bg-muted/20 p-4 space-y-3">
          <h3 className="font-display text-base">Внутренняя заметка ЦКР</h3>
          <p className="text-xs text-muted">
            Видно только сотрудникам ЦКР. Клиент это не увидит.
          </p>
          <form action={addCkrRequestCommentAction} className="space-y-2">
            <input type="hidden" name="requestId" value={requestId} />
            <input type="hidden" name="visibility" value="INTERNAL" />
            <textarea
              name="body"
              rows={3}
              required
              className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
              placeholder="Внутренняя заметка"
            />
            <button
              type="submit"
              className="rounded-sm border border-border px-3 py-2 text-sm"
            >
              Сохранить internal
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
