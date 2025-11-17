import type { Metadata } from "next";
import ContentLayout from "@/components/ui/ContentLayout";
import { prisma } from "@repo/db";
import { generateMetadataCustom } from "@/app/utils/data/actions";
import { redirect } from "next/navigation";
import {
  IconInfinity,
  IconMoodEmpty,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Pagination from "@/components/ui/Pagination";
import Link from "next/link";
import SearchInput from "@/components/ui/SearchInput";
import DeleteModal from "@/components/ui/DeleteModal";

// Metadata

type Props = Promise<{ id: string }>;

export async function generateMetadata(props: {
  params: Props;
}): Promise<Metadata> {
  return generateMetadataCustom(
    (await props.params).id,
    true,
    prisma.lock,
    "Accès de la serrure ",
  );
}

// ----------------------------

const AUTHORIZATIONS_PER_PAGE = 30;
const now = Date.now();

const LockAuthorization = async (props: {
  params: Props;
  searchParams: Promise<{ [id: string]: string | undefined }>;
}) => {
  const params = await props.params;
  const urlParams = await props.searchParams;

  const currentPage = Number(urlParams?.page) || 1;
  const search = urlParams?.search || "";

  let totalPages;

  // Fetch lock or redirect to 404

  let lock;
  let authorizations;

  try {
    lock = await prisma.lock.findUniqueOrThrow({
      select: {
        id: true,
        name: true,
        nukiId: true,
        nukiApiKey: true,
        phoneNumber: true,
      },
      where: {
        id: Number(params.id),
      },
    });

    totalPages = await prisma.authorization
      .count({
        where: {
          lockId: lock.id,
        },
      })
      .then((count) => Math.ceil(count / AUTHORIZATIONS_PER_PAGE));

    authorizations = await prisma.authorization.findMany({
      select: {
        id: true,
        startAt: true,
        endAt: true,
        createdAt: true,
        active: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
        logs: {
          select: {
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        _count: {
          select: {
            logs: true,
          },
        },
      },
      where: {
        lockId: lock.id,
        user: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
      skip: (currentPage - 1) * AUTHORIZATIONS_PER_PAGE,
      take: AUTHORIZATIONS_PER_PAGE,
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch {
    redirect("/errors/404");
  }

  // Page data

  const pageData = {
    ariane: [
      { label: "lock.crf", href: "/dashboard" },
      { label: "Serrures", href: "/dashboard/locks" },
      { label: lock.name, href: `/dashboard/locks/${lock.id}` },
      {
        label: "Gestion des accès",
        href: `/dashboard/locks/${lock.id}/authorizations`,
      },
    ],
    title: `Gérer les accès de la serrure ${lock.name}`,
    button: "",
    buttonIcon: null,
    buttonLink: "",
  };

  // DOM rendering

  return (
    <ContentLayout subHeaderProps={pageData}>
      <div className="card">
        <div className="card-table">
          <div className="card-header">
            <div className="row w-full">
              <div className="col">
                <h3 className="card-title mb-0">Accès à la serrure accordés</h3>
                <p className="text-secondary m-0">
                  Une fois que l&apos;accès est accordé, l&apos;utilisateur
                  pourra contrôler la serrure.
                </p>
              </div>
              <div className="col-md-auto col-sm-12">
                <div className="ms-auto d-flex flex-wrap btn-list">
                  <SearchInput />

                  <Link
                    href={`/dashboard/locks/${lock.id}/authorizations/add`}
                    className="btn btn-0 btn-primary"
                  >
                    <IconPlus className="icon icon-2" /> Nouveau
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div id="advanced-table">
            <div className="table-responsive">
              <table className="table table-vcenter table-selectable">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Début</th>
                    <th>Fin</th>
                    <th>Statut</th>
                    <th>Créé par</th>
                    <th>Utilisations</th>
                    <th>Dernière utilisation</th>
                    <th className="w-1">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-tbody">
                  {authorizations.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="empty m-2">
                          <div className="empty-icon">
                            <IconMoodEmpty className="icon" />
                          </div>
                          <p className="empty-title">
                            Aucun accès accordé pour l&apos;instant...
                          </p>
                          <p className="empty-subtitle text-secondary">
                            Si vous pensez qu&apos;il s&apos;agit d&apos;une
                            erreur, signalez-le au plus vite.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <></>
                  )}

                  {authorizations.map((authorization) => {
                    const realStart = authorization.startAt
                      ? authorization.startAt
                      : new Date(0);
                    const realEnd = authorization.endAt
                      ? authorization.endAt
                      : new Date(2099, 12, 31);

                    let lastTime;

                    try {
                      lastTime =
                        formatDistanceToNow(authorization.logs[0]?.createdAt, {
                          locale: fr,
                        }) || "un moment";
                    } catch {
                      lastTime = "Jamais";
                    }

                    return (
                      <tr key={authorization.id}>
                        <td>
                          <span
                            className="avatar avatar-xs me-2"
                            style={{
                              backgroundImage: `url(${authorization.user.image})`,
                            }}
                          >
                            {" "}
                          </span>
                          {authorization.user.name}
                        </td>
                        <td>
                          {authorization.startAt
                            ? authorization.startAt.toLocaleDateString("fr-FR")
                            : authorization.createdAt.toLocaleDateString(
                                "fr-FR",
                              )}
                        </td>
                        <td>
                          {authorization.endAt ? (
                            authorization.endAt.toLocaleDateString("fr-FR")
                          ) : (
                            <IconInfinity className="icon" />
                          )}
                        </td>
                        <td>
                          {now > realStart && now < realEnd ? (
                            authorization.active ? (
                              <span className="badge bg-success-lt">Actif</span>
                            ) : (
                              <span className="badge bg-error-lt">
                                Désactivé
                              </span>
                            )
                          ) : (
                            <span className="badge bg-error-lt">Expiré</span>
                          )}
                        </td>
                        <td>{authorization.createdBy.name}</td>
                        <td>{authorization._count.logs}</td>
                        <td>{lastTime}</td>
                        <td>
                          <div className="btn-actions">
                            <button
                              className="btn btn-action"
                              data-bs-toggle="modal"
                              data-bs-target={`#modal-delete-${authorization.id}`}
                            >
                              <IconTrash className="icon icon-1" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="card-footer d-flex align-items-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                classNames="m-0 ms-auto"
              />
            </div>
          </div>
        </div>
      </div>
      {authorizations.map((authorization) => {
        return (
          <DeleteModal
            id={authorization.id}
            alert="Cela supprimera ou désactivera définitivement l'autorisation."
            message="Autorisation supprimée ou désactivée avec succès"
            url="/api/authorizations/"
            key={authorization.id}
          />
        );
      })}
    </ContentLayout>
  );
};

export default LockAuthorization;
