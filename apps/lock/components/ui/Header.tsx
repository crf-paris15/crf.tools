import { auth } from "auth";
import { prisma } from "@repo/db";
import { SignOutButton } from "@/components/auth/SignOutButton";
import {
  IconCircleKey,
  IconLogs,
  IconSearch,
  IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";
import { redirect } from "next/navigation";

async function Header() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      name: true,
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return (
    <div className="page">
      <header className="navbar navbar-expand-md navbar-light d-print-none">
        <div className="container-xl">
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbar-menu"
            aria-controls="navbar-menu"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <h1 className="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
            <Link href="/dashboard">lock.crf</Link>
          </h1>

          <div className="navbar-nav flex-row order-md-last">
            <div className="nav-item dropdown">
              <a
                href="#"
                className="nav-link d-flex lh-1 text-reset p-0"
                data-bs-toggle="dropdown"
              >
                <span
                  className="avatar avatar-sm"
                  style={{ backgroundImage: `url(${session.user.image})` }}
                ></span>
                <div className="d-none d-xl-block ps-2">
                  <div>{user.name}</div>
                  <div className="mt-1 small text-secondary">
                    {user.group.name}
                  </div>
                </div>
              </a>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>
      <header className="navbar-expand-md">
        <div className="collapse navbar-collapse" id="navbar-menu">
          <div className="navbar">
            <div className="container-xl">
              <div className="row flex-fill align-items-center">
                <div className="col">
                  <ul className="navbar-nav">
                    <li className="nav-item">
                      <Link className="nav-link" href="/dashboard/locks">
                        <span className="nav-link-icon d-md-none d-lg-inline-block">
                          <IconCircleKey className="Icon" />
                        </span>
                        <span className="nav-link-title">Serrures</span>
                      </Link>
                    </li>
                    <li className="nav-item dropdown">
                      <a
                        className="nav-link"
                        data-bs-toggle="dropdown"
                        role="button"
                      >
                        <span className="nav-link-icon d-md-none d-lg-inline-block">
                          <IconUsers className="Icon" />
                        </span>
                        <span className="nav-link-title">Utilisateurs</span>
                      </a>
                      <div className="dropdown-menu dropdown-menu-start">
                        <Link
                          className="dropdown-item"
                          href="/dashboard/users?guests=0"
                        >
                          Bénévoles
                        </Link>
                        <Link
                          className="dropdown-item"
                          href="/dashboard/users?guests=1"
                        >
                          Invités
                        </Link>
                        <div className="dropdown-divider"></div>
                        <Link className="dropdown-item" href="/dashboard/users">
                          Tous
                        </Link>
                        <div className="dropdown-divider"></div>
                        <Link
                          className="dropdown-item"
                          href="/dashboard/users/import"
                        >
                          Importer en masse
                        </Link>
                      </div>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" href="/dashboard/logs">
                        <span className="nav-link-icon d-md-none d-lg-inline-block">
                          <IconLogs className="Icon" />
                        </span>
                        <span className="nav-link-title">Journaux</span>
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="col-3 d-none d-xxl-block">
                  <div className="my-3 my-md-0 flex-grow-1 flex-md-grow-0 order-first order-md-last">
                    <form
                      action="/dashboard/search"
                      method="get"
                      autoComplete="off"
                      noValidate={true}
                    >
                      <div className="input-icon">
                        <span className="input-icon-addon">
                          <IconSearch className="Icon" />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Rechercher..."
                          aria-label="Search in website"
                        />
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default Header;
