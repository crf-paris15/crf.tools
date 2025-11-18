import type { Metadata } from "next";
import { IconMoodEmpty } from "@tabler/icons-react";
import { prisma } from "@repo/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import parsePhoneNumber from "libphonenumber-js";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  generateMetadataCustom,
  logNumberToText,
} from "@/app/utils/data/actions";
import EditLockModal from "@/components/locks/EditLockModal";
import LockHeader from "@/components/locks/LockHeader";

type Props = Promise<{ id: string }>;

// Metadata generation that redirects to 404 if the lock is not found

export async function generateMetadata(props: {
  params: Props;
}): Promise<Metadata> {
  return generateMetadataCustom((await props.params).id, true, prisma.lock);
}

// ----------------------------

const Lock = async (props: { params: Props }) => {
  const params = await props.params;

  // Fetch lock or redirect to 404

  let lock;
  let countAuthorizations;

  try {
    lock = await prisma.lock.findUniqueOrThrow({
      select: {
        id: true,
        name: true,
        nukiId: true,
        nukiApiKey: true,
        phoneNumber: true,
        logs: {
          select: {
            id: true,
            action: true,
            details: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
        },
      },
      where: {
        id: Number(params.id),
      },
    });

    countAuthorizations = await prisma.authorization.count({
      where: {
        lockId: lock.id,
        OR: [
          {
            AND: [
              {
                startAt: { lte: new Date() },
              },
              {
                endAt: { gte: new Date() },
              },
            ],
          },
          {
            AND: [
              {
                startAt: { lte: new Date() },
              },
              {
                endAt: null,
              },
            ],
          },
          {
            AND: [
              {
                startAt: null,
              },
              {
                endAt: { gte: new Date() },
              },
            ],
          },
          {
            AND: [
              {
                startAt: null,
              },
              {
                endAt: null,
              },
            ],
          },
        ],
      },
    });
  } catch {
    redirect("/errors/404");
  }

  const lastAction = await prisma.log.findFirst({
    where: {
      lockId: lock.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      user: {
        select: {
          name: true,
        },
      },
      createdAt: true,
    },
  });

  let lastTime;

  try {
    lastTime =
      formatDistanceToNow(lastAction?.createdAt, {
        locale: fr,
      }) || "un moment";
  } catch {
    lastTime = "un moment";
  }

  let logsJSX = (
    <div className="col-12">
      <div className="card">
        <div className="empty">
          <div className="empty-icon">
            <IconMoodEmpty className="icon" />
          </div>
          <p className="empty-title">
            Aucune utilisation pour l&apos;instant...
          </p>
          <p className="empty-subtitle text-secondary">
            Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, signalez-le
            au plus vite.
          </p>
        </div>
      </div>
    </div>
  );

  if (lock.logs.length !== 0) {
    logsJSX = (
      <div className="card-table table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Personne</th>
              <th>Action</th>
              <th>Détails</th>
              <th>Date et heure</th>
            </tr>
          </thead>
          <tbody>
            {lock.logs.map((log) => {
              return (
                <tr key={log.id}>
                  <td>
                    {log.user && (
                      <div className="d-flex py-1 align-items-center">
                        <span
                          className="avatar me-2"
                          style={{
                            backgroundImage: `url(${log.user.image})`,
                          }}
                        ></span>
                        <div className="flex-fill">
                          <div className="font-weight-medium">
                            {log.user.name}
                          </div>
                        </div>
                      </div>
                    )}
                    {!log.user && (
                      <div className="d-flex py-1 align-items-center">
                        <div className="flex-fill">
                          <div className="font-weight-medium">Inconnu</div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td>{logNumberToText(log.action)}</td>
                  <td>{log.details}</td>
                  <td>
                    {log.createdAt.toLocaleDateString()} à{" "}
                    {log.createdAt.toLocaleTimeString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Page data

  const ariane = [
    { label: "lock.crf", href: "/dashboard" },
    { label: "Serrures", href: "/dashboard/locks" },
    { label: lock.name, href: `/dashboard/locks/${lock.id}` },
  ];

  // DOM rendering

  return (
    <div className="page-wrapper">
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="mb-3">
            <ol className="breadcrumb" aria-label="breadcrumbs">
              {ariane.map(({ label, href }, index) => (
                <li
                  key={index}
                  className={clsx(
                    "breadcrumb-item",
                    index === ariane.length - 1 && "active",
                  )}
                >
                  <Link href={href}>{label}</Link>
                </li>
              ))}
            </ol>
          </div>
          <LockHeader lock={lock} />
        </div>
      </div>
      <div className="page-body">
        <div className="container-xl">
          <div className="row row-cards">
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <div className="subheader">Téléphone lié</div>
                  <div className="h3 m-0">
                    {lock.phoneNumber
                      ? parsePhoneNumber(
                          lock.phoneNumber,
                        )?.formatInternational()
                      : "Aucun"}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <div className="subheader">
                    Personnes ayant accès actuellement
                  </div>
                  <div className="h3 m-0">{countAuthorizations}</div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <div className="subheader">Dernière action par</div>
                  <div className="h3 m-0">
                    {lastAction?.user?.name || "Inconnu"} il y a {lastTime}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="card">{logsJSX}</div>
            </div>
          </div>
        </div>
      </div>

      <EditLockModal formProps={{ lock }} />
    </div>
  );
};

export default Lock;
