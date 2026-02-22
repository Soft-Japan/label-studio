import { format } from "date-fns";
import { NavLink } from "react-router-dom";
import { IconCross } from "@humansignal/icons";
import { Userpic, Button } from "@humansignal/ui";
import { cn } from "../../../utils/bem";
import "./SelectedUser.scss";
import { useOrganizationI18n } from "../i18n";

const UserProjectsLinks = ({ projects }) => {
  return (
    <div className={cn("user-info").elem("links-list").toClassName()}>
      {projects.map((project) => (
        <NavLink
          className={cn("user-info").elem("project-link").toClassName()}
          key={`project-${project.id}`}
          to={`/projects/${project.id}`}
          data-external
        >
          {project.title}
        </NavLink>
      ))}
    </div>
  );
};

export const SelectedUser = ({ user, onClose }) => {
  const runtimeLanguage =
    window.APP_SETTINGS?.language_code ??
    window.APP_SETTINGS?.user?.language ??
    window.APP_SETTINGS?.user?.language_code;
  const { t } = useOrganizationI18n(runtimeLanguage);
  const fullName = [user.first_name, user.last_name]
    .filter((n) => !!n)
    .join(" ")
    .trim();

  return (
    <div className={cn("user-info").toClassName()}>
      <Button
        look="string"
        onClick={onClose}
        className="absolute top-[20px] right-[24px]"
        aria-label={t("organization.people.closeUserDetails")}
      >
        <IconCross />
      </Button>

      <div className={cn("user-info").elem("header").toClassName()}>
        <Userpic user={user} style={{ width: 64, height: 64, fontSize: 28 }} />
        <div className={cn("user-info").elem("info-wrapper").toClassName()}>
          {fullName && <div className={cn("user-info").elem("full-name").toClassName()}>{fullName}</div>}
          <p className={cn("user-info").elem("email").toClassName()}>{user.email}</p>
        </div>
      </div>

      {user.phone && (
        <div className={cn("user-info").elem("section").toClassName()}>
          <a href={`tel:${user.phone}`}>{user.phone}</a>
        </div>
      )}

      {!!user.created_projects.length && (
        <div className={cn("user-info").elem("section").toClassName()}>
          <div className={cn("user-info").elem("section-title").toClassName()}>{t("organization.people.createdProjects")}</div>

          <UserProjectsLinks projects={user.created_projects} />
        </div>
      )}

      {!!user.contributed_to_projects.length && (
        <div className={cn("user-info").elem("section").toClassName()}>
          <div className={cn("user-info").elem("section-title").toClassName()}>{t("organization.people.contributedTo")}</div>

          <UserProjectsLinks projects={user.contributed_to_projects} />
        </div>
      )}

      <p className={cn("user-info").elem("last-active").toClassName()}>
        {t("organization.people.lastActivityOn")} {format(new Date(user.last_activity), "dd MMM yyyy, KK:mm a")}
      </p>
    </div>
  );
};