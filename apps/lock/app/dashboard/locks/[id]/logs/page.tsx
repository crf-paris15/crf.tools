import type { Metadata } from "next";
import { IconMoodEmpty } from "@tabler/icons-react";
import { prisma } from "@repo/db";
import { redirect } from "next/navigation";
import { generateMetadataCustom } from "@/app/utils/data/actions";
import ContentLayout from "@/components/ui/ContentLayout";
import Pagination from "@/components/ui/Pagination";
import RowLog from "@/components/logs/RowLog";
import HeaderRowLog from "@/components/logs/HeaderRowLog";

type Props = Promise<{ id: string }>;

const LOGS_PER_PAGE = 30;

// Metadata generation that redirects to 404 if the lock is not found

export async function generateMetadata(props: {
  params: Props;
}): Promise<Metadata> {
  return generateMetadataCustom((await props.params).id, true, prisma.lock);
}

// ----------------------------

const Logs = async (props: {
  params: Props;
  searchParams: Promise<{ [page: string]: string | string[] | undefined }>;
}) => {
  const params = await props.params;
  const urlParams = await props.searchParams;
  const currentPage = Number(urlParams?.page) || 1;

  let totalPages;
  let logs;
  let lock;

  try {
    lock = await prisma.lock.findUniqueOrThrow({
      select: {
        id: true,
        name: true,
      },
      where: {
        id: Number(params.id),
      },
    });

    totalPages = await prisma.log
      .count({
        where: {
          lock: {
            id: Number(params.id),
          },
        },
      })
      .then((count) => Math.ceil(count / LOGS_PER_PAGE));

    logs = await prisma.log.findMany({
      select: {
        id: true,
        action: true,
        details: true,
        createdAt: true,
        success: true,
        source: true,
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
      where: {
        lock: {
          id: lock.id,
        },
      },
      skip: (currentPage - 1) * LOGS_PER_PAGE,
      take: LOGS_PER_PAGE,
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
        label: "Logs",
        href: `/dashboard/locks/${lock.id}/logs`,
      },
    ],
    title: `Logs de la serrure ${lock.name}`,
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
                <h3 className="card-title mb-0">Historique d&apos;accès</h3>
                <p className="text-secondary m-0">
                  Les actions effectuées via le serveur vocal,
                  l&apos;application Nuki et le panel admin sont enregistrées
                  ici.
                </p>
              </div>
            </div>
          </div>
          <div id="advanced-table">
            <div className="table-responsive">
              <table className="table table-vcenter">
                <HeaderRowLog />
                <tbody className="table-tbody">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="empty m-2">
                          <div className="empty-icon">
                            <IconMoodEmpty className="icon" />
                          </div>
                          <p className="empty-title">
                            Aucun log pour l&apos;instant...
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

                  {logs.map((log) => (
                    <RowLog key={log.id} {...log} />
                  ))}
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
    </ContentLayout>
  );
};

export default Logs;
