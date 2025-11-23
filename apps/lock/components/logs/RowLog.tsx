import { logNumberToText } from "@/app/utils/data/actions";
import {
  IconDeviceDesktopAnalytics,
  IconDeviceMobile,
  IconGhost3,
  IconLock,
  IconLockOpen2,
  IconPhone,
  IconPhoneOutgoing,
  IconQuestionMark,
  IconUser,
  IconX,
} from "@tabler/icons-react";

const RowLog = (log) => (
  <tr key={log.id}>
    <td>
      {log.user && (
        <div className="d-flex py-1 align-items-center">
          {log.user.image && (
            <span
              className="avatar avatar-sm me-2"
              style={{
                backgroundImage: `url(${log.user.image})`,
              }}
            ></span>
          )}
          {!log.user.image && (
            <span className="avatar avatar-sm me-2">
              <IconUser className="icon avatar-icon icon-2" />
            </span>
          )}
          <div className="flex-fill">
            <div className="font-weight-medium">{log.user.name}</div>
          </div>
        </div>
      )}
      {!log.user && (
        <div className="d-flex py-1 align-items-center">
          <span className="avatar avatar-sm me-2">
            {log.details ? (
              log.details.startsWith("+") ? (
                <IconX className="icon avatar-icon icon-2" />
              ) : (
                <IconQuestionMark className="icon avatar-icon icon-2" />
              )
            ) : (
              <IconGhost3 className="icon avatar-icon icon-2" />
            )}
          </span>
          <div className="flex-fill">
            <div className="font-weight-medium">
              {log.details ? log.details : "Inconnu"}
            </div>
          </div>
        </div>
      )}
    </td>
    <td>
      {log.action === 1 ? (
        <IconLockOpen2 className="icon me-1" />
      ) : log.action === 2 ? (
        <IconLock className="icon me-1" />
      ) : log.action === null ? (
        <IconPhoneOutgoing className="icon me-1" />
      ) : (
        <IconQuestionMark className="icon me-1" />
      )}
      {logNumberToText(log.action)}
    </td>
    <td>
      {log.success === true ? (
        <span className="badge bg-green text-green-fg">Réussite</span>
      ) : log.success === false ? (
        log.details == 42 ? (
          <span className="badge bg-red text-red-fg">Moteur bloqué</span>
        ) : (
          <span className="badge bg-red text-red-fg">Échec</span>
        )
      ) : log.action === null ? (
        log.details === "Date" ? (
          <span className="badge bg-red text-red-fg">
            Interdit à cette date
          </span>
        ) : (
          <span className="badge bg-red text-red-fg">Interdit</span>
        )
      ) : (
        <span className="badge bg-grey">Inconnu</span>
      )}
    </td>
    <td>
      {log.createdAt.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}{" "}
      à{" "}
      {log.createdAt.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Paris",
      })}
    </td>
    <td className="text-center">
      {log.source === 0 ? (
        <IconDeviceMobile className="icon" />
      ) : log.source === 1 ? (
        <IconDeviceDesktopAnalytics className="icon" />
      ) : log.source === 2 ? (
        <IconPhone className="icon" />
      ) : (
        <IconQuestionMark className="icon" />
      )}
    </td>
  </tr>
);

export default RowLog;
