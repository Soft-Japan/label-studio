import { Callout, CalloutContent, CalloutHeader, CalloutIcon, CalloutTitle } from "@humansignal/ui/lib/callout/callout";
import { IconWarning } from "@humansignal/icons";
import { atomWithMutation, atomWithQuery, queryClientAtom } from "jotai-tanstack-query";
import { useAtomValue } from "jotai";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { getApiInstance, useCopyText } from "@humansignal/core";
import styles from "./PersonalJWTToken.module.scss";
import { Button } from "@humansignal/ui";
import { useAccountSettingsI18n } from "../i18n";

/**
 * FIXME: This is legacy imports. We're not supposed to use such statements
 * each one of these eventually has to be migrated to core/ui
 */
import { modal, confirm } from "@humansignal/ui/lib/modal";
import { Input, Label } from "apps/labelstudio/src/components/Form/Elements";
import { Tooltip } from "@humansignal/ui";
import { create } from "domain";

type Token = {
  token: string;
  expires_at: string;
};

const ACCESS_TOKENS_QUERY_KEY = ["access-tokens"];

// list all existing API tokens
const tokensListAtom = atomWithQuery(() => ({
  queryKey: ACCESS_TOKENS_QUERY_KEY,
  async queryFn() {
    const api = getApiInstance();
    const tokens = await api.invoke("accessTokenList");
    if (!tokens.$meta.ok) {
      console.error(token.error);
      return [];
    }

    return tokens as Token[];
  },
}));

// despite the name, gets user's access token
const refreshTokenAtom = atomWithMutation((get) => {
  const queryClient = get(queryClientAtom);
  return {
    mutationKey: ["refresh-token"],
    async mutationFn() {
      const api = getApiInstance();
      const token = await api.invoke("accessTokenGetRefreshToken");
      if (!token.$meta.ok) {
        console.error(token.error);
        return "";
      }
      return token.token;
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: ACCESS_TOKENS_QUERY_KEY });
    },
  };
});

const revokeTokenAtom = atomWithMutation((get) => {
  const queryClient = get(queryClientAtom);
  return {
    mutationKey: ["revoke"],
    async mutationFn({ token }: { token: string }) {
      const api = getApiInstance();
      await api.invoke("accessTokenRevoke", null, {
        params: {},
        body: {
          refresh: token,
        },
      });
    },
    // Optimistic update
    async onMutate({ token }: { token: string }) {
      // Cancel all ongoing queries so we can override the data they hold
      await queryClient.cancelQueries({ queryKey: ACCESS_TOKENS_QUERY_KEY });
      // Getting currently cached data of a specific query
      const previousTokens = queryClient.getQueryData(ACCESS_TOKENS_QUERY_KEY) as Token[];
      // We need to keep everything but one token that we just deleted
      const filtered = previousTokens.filter((t) => t.token !== token);
      // We now optimistically override data inside the query
      queryClient.setQueryData(ACCESS_TOKENS_QUERY_KEY, (old: Token[]) => filtered as Token[]);
      return { previousTokens };
    },
    onError: (err, newTodo, context) => {
      // If error, reset query to its previous state (without changes from `onMutate`)
      queryClient.setQueryData(ACCESS_TOKENS_QUERY_KEY, context?.previousTokens);
    },
    onSettled() {
      // Reload query from remote if deletion went ok
      queryClient.invalidateQueries({
        queryKey: ACCESS_TOKENS_QUERY_KEY,
      });
    },
  };
});

export function PersonalJWTToken() {
  const { t } = useAccountSettingsI18n();
  const [dialogOpened, setDialogOpened] = useState(false);
  const tokens = useAtomValue(tokensListAtom);
  const revokeToken = useAtomValue(revokeTokenAtom);
  const createToken = useAtomValue(refreshTokenAtom);
  const queryClient = useAtomValue(queryClientAtom);

  const tokensListClassName = clsx({
    [styles.tokensList]: tokens.data && tokens.data.length,
  });

  const revoke = useCallback(
    async (token: string) => {
      confirm({
        title: t("accountSettings.personalJwtToken.revokeToken"),
        body: t("accountSettings.personalJwtToken.revokeBody", {
          appName: window?.APP_SETTINGS?.app_name || "Label Studio",
        }),
        okText: t("accountSettings.personalJwtToken.revoke"),
        buttonLook: "negative",
        onOk: async () => {
          await revokeToken.mutateAsync({ token });
        },
      });
    },
    [revokeToken, t],
  );

  const disallowAddingTokens = useMemo(() => {
    return createToken.isPending || tokens.isLoading || (tokens.data?.length ?? 0) > 0;
  }, [createToken.isPending, tokens.isLoading, tokens.data]);

  function openDialog() {
    if (dialogOpened) return;
    setDialogOpened(true);
    modal({
      visible: true,
      title: t("accountSettings.personalJwtToken.newAuthToken"),
      style: { width: 680 },
      body: CreateTokenForm,
      closeOnClickOutside: false,
      onHidden: () => {
        setDialogOpened(false);
        queryClient.invalidateQueries({ queryKey: ACCESS_TOKENS_QUERY_KEY });
      },
    });
  }

  return (
    <div className={styles.personalAccessToken}>
      <div className={tokensListClassName}>
        {tokens.isLoading ? (
          <div>{t("accountSettings.personalJwtToken.loading")}</div>
        ) : tokens.isSuccess && tokens.data && tokens.data.length ? (
          <div>
            <Label text={t("accountSettings.personalAccessToken.accessToken")} className={styles.label} />
            <div className="flex flex-col gap-2">
              {tokens.data.map((token, index) => {
                return (
                  <div key={`${token.expires_at}${index}`} className={styles.token}>
                    <div className={styles.tokenWrapper}>
                      <div className={styles.expirationDate}>
                        {token.expires_at
                          ? t("accountSettings.personalJwtToken.expiresOn", {
                              date: format(new Date(token.expires_at), "MMM dd, yyyy HH:mm"),
                            })
                          : t("accountSettings.personalJwtToken.personalAccessToken")}
                      </div>
                      <div className={styles.tokenString}>{token.token}</div>
                    </div>
                    <Button variant="negative" look="outlined" onClick={() => revoke(token.token)}>
                      {t("accountSettings.personalJwtToken.revoke")}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : tokens.isError ? (
          <div>{t("accountSettings.personalJwtToken.unableToLoadTokensList")}</div>
        ) : null}
      </div>
      <Tooltip title={t("accountSettings.personalJwtToken.oneActiveToken")} disabled={!disallowAddingTokens}>
        <div style={{ width: "max-content" }}>
          <Button disabled={disallowAddingTokens || dialogOpened} onClick={openDialog}>
            {t("accountSettings.personalJwtToken.createNewToken")}
          </Button>
        </div>
      </Tooltip>
    </div>
  );
}

function CreateTokenForm() {
  const { t } = useAccountSettingsI18n();
  const { data, mutate: createToken } = useAtomValue(refreshTokenAtom);
  const [copy, copied] = useCopyText({ defaultText: data ?? "" });

  useEffect(() => {
    createToken();
  }, [createToken]);

  return (
    <div className="flex flex-col gap-2">
      <p>{t("accountSettings.personalJwtToken.copyNotice")}</p>

      <div className="flex items-end w-full gap-2">
        <Input
          label={t("accountSettings.personalJwtToken.accessToken")}
          labelProps={{ className: "flex-1", rawClassName: "flex-1" }}
          className="w-full"
          readOnly
          value={data ?? ""}
        />
        <Button onClick={() => copy()} disabled={copied} variant="neutral" look="outlined">
          {copied ? t("accountSettings.personalAccessToken.copied") : t("accountSettings.personalAccessToken.copy")}
        </Button>
      </div>

      {data?.expires_at && (
        <div>
          <Label text={t("accountSettings.personalJwtToken.tokenExpiryDate")} />
          {data && format(new Date(data?.expires_at), "MMM dd, yyyy HH:mm z")}
        </div>
      )}

      <Callout variant="warning">
        <CalloutHeader>
          <CalloutIcon>
            <IconWarning />
          </CalloutIcon>
          <CalloutTitle>{t("accountSettings.personalJwtToken.manageSecurely")}</CalloutTitle>
        </CalloutHeader>
        <CalloutContent>{t("accountSettings.personalJwtToken.securityBody")}</CalloutContent>
      </Callout>
    </div>
  );
}
