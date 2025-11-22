import type { Metadata } from "next";
import ContentLayout from "@/components/ui/ContentLayout";
import { IconMoodEmpty, IconPlus, IconUser } from "@tabler/icons-react";
import { prisma } from "@repo/db";
import parsePhoneNumber from "libphonenumber-js";
import EditUserModal from "@/components/users/EditUserModal";
import DeleteModal from "@/components/ui/DeleteModal";
import Pagination from "@/components/ui/Pagination";
import { auth } from "auth";
import SearchInput from "@/components/ui/SearchInput";

// Metadata

const USERS_PER_PAGE = 30;

export async function generateMetadata({ searchParams }): Promise<Metadata> {
  const guests = (await searchParams).guests;
  let title = "Utilisateurs";

  if (guests === "0") {
    title = "Bénévoles";
  } else if (guests === "1") {
    title = "Invités";
  }

  return {
    title,
  };
}

// ----------------------------

const Users = async (props: {
  searchParams: Promise<{ [page: string]: string | string[] | undefined }>;
}) => {
  // Fetch users

  const urlParams = await props.searchParams;
  const guests = urlParams.guests;
  const search = urlParams?.search || "";

  const currentPage = Number(urlParams?.page) || 1;
  const totalPages = await prisma.user
    .count({
      where: {
        groupId:
          guests === "1"
            ? 0
            : guests === "0"
              ? {
                  not: 0,
                }
              : undefined,
        OR: [
          {
            name: {
              contains: String(search),
              mode: "insensitive",
            },
          },
          {
            phoneNumber: {
              contains: String(search),
              mode: "insensitive",
            },
          },
        ],
      },
    })
    .then((count) => Math.ceil(count / USERS_PER_PAGE));

  const session = await auth();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      image: true,
      nukiAccountId: true,
      group: {
        select: {
          name: true,
        },
      },
      groupId: true,
      authorizations: {
        select: {
          lock: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: { logs: true },
      },
    },
    where: {
      groupId:
        guests === "1"
          ? 0
          : guests === "0"
            ? {
                not: 0,
              }
            : undefined,
      OR: [
        {
          name: {
            contains: String(search),
            mode: "insensitive",
          },
        },
        {
          phoneNumber: {
            contains: String(search),
            mode: "insensitive",
          },
        },
      ],
    },
    orderBy: {
      name: "asc",
    },
    skip: (currentPage - 1) * USERS_PER_PAGE,
    take: USERS_PER_PAGE,
  });

  const groups = await prisma.group.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  // Page data

  let userType = "utilisateurs";
  const ariane = [
    { label: "lock.crf", href: "/dashboard" },
    { label: "Utilisateurs", href: "/dashboard/users" },
  ];

  if (guests === "0") {
    userType = "bénévoles";
  } else if (guests === "1") {
    userType = "invités";
  }

  if (guests) {
    ariane.push({
      label: userType.charAt(0).toUpperCase() + userType.slice(1),
      href: `/dashboard/users?guests=${guests}`,
    });
  }

  const pageData = {
    ariane,
    title: "Liste des " + userType,
    button: "Ajouter un utilisateur",
    buttonIcon: <IconPlus className="icon" />,
    buttonLink: "/dashboard/users/add",
  };

  // DOM rendering

  return (
    <ContentLayout subHeaderProps={pageData}>
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-table">
              <div className="card-header">
                <div className="row w-full">
                  <div className="col">
                    <h3 className="card-title mb-0">Liste des utilisateurs</h3>
                    <p className="text-secondary m-0">
                      Utilisez le champ de recherche pour trouver un utilisateur
                      par son nom ou son numéro de téléphone (sans le zéro
                      initial et sans espace).
                    </p>
                  </div>
                  <div className="col-md-auto col-sm-12">
                    <div className="ms-auto d-flex flex-wrap btn-list">
                      <SearchInput />
                    </div>
                  </div>
                </div>
              </div>
              <div id="advanced-table">
                <div className="table-responsive">
                  <table className="table table-vcenter card-table">
                    <thead>
                      <tr>
                        <th>Utilisateur</th>
                        <th>Groupe</th>
                        <th>Accès</th>
                        <th className="w-1"></th>
                      </tr>
                    </thead>
                    <tbody className="table-tbody">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={8}>
                            <div className="empty m-2">
                              <div className="empty-icon">
                                <IconMoodEmpty className="icon" />
                              </div>
                              <p className="empty-title">
                                Aucun utilisateur trouvé...
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
                      {users.map((user) => {
                        let color = "grey";

                        if (user.groupId === 1) {
                          color = "blue";
                        } else if (user.groupId === 2) {
                          color = "green";
                        } else if (user.groupId === 3) {
                          color = "red";
                        }

                        return (
                          <tr key={user.id}>
                            <td>
                              <div className="d-flex py-1 align-items-center">
                                {user.image && (
                                  <span
                                    className="avatar me-2"
                                    style={{
                                      backgroundImage: `url(${user.image})`,
                                    }}
                                  ></span>
                                )}
                                {!user.image && (
                                  <span className="avatar me-2">
                                    <IconUser className="icon avatar-icon icon-2" />
                                  </span>
                                )}
                                <div className="flex-fill">
                                  <div className="font-weight-medium">
                                    {user.name}
                                  </div>
                                  <div className="text-secondary">
                                    {user.phoneNumber &&
                                      parsePhoneNumber(
                                        user.phoneNumber,
                                      ).formatInternational()}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td>
                              <div>
                                <span
                                  className={
                                    "badge bg-" +
                                    color +
                                    " text-" +
                                    color +
                                    "-fg"
                                  }
                                >
                                  {user.group.name}
                                </span>
                              </div>
                            </td>

                            <td>
                              <div className="badges-list">
                                {user.authorizations.length === 0 && "Aucun"}
                                {user.authorizations
                                  .filter(
                                    (authorization, index, self) =>
                                      index ===
                                      self.findIndex(
                                        (a) =>
                                          a.lock.id === authorization.lock.id,
                                      ),
                                  )
                                  .map((authorization) => {
                                    return (
                                      <span key={authorization.lock.id}>
                                        <span className="badge">
                                          {authorization.lock.name}
                                        </span>{" "}
                                      </span>
                                    );
                                  })}
                              </div>
                            </td>

                            <td>
                              <div
                                className="btn-list flex-nowrap"
                                style={{ flexDirection: "row-reverse" }}
                              >
                                <button
                                  className="btn"
                                  data-bs-toggle="modal"
                                  data-bs-target={"#modal-edit-" + user.id}
                                >
                                  &Eacute;diter
                                </button>
                                {user._count.logs === 0 &&
                                  user.id !== session.user.id && (
                                    <button
                                      className="btn"
                                      data-bs-toggle="modal"
                                      data-bs-target={
                                        "#modal-delete-" + user.id
                                      }
                                    >
                                      Supprimer
                                    </button>
                                  )}
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
        </div>
      </div>

      {users.map((user) => {
        return (
          <div key={user.id}>
            <EditUserModal
              formProps={{
                user,
                groups,
              }}
              key={user.id}
            />

            <DeleteModal
              id={user.id}
              alert="Cela supprimera définitivement l'utilisateur."
              message="Utilisateur supprimé avec succès"
              url="/api/users/"
            />
          </div>
        );
      })}
    </ContentLayout>
  );
};

export default Users;
