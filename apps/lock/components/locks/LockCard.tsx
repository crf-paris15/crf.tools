"use client";

import { fetcher, sendNukiAction } from "@/app/utils/data/actions";
import { IconInfoCircle, IconLock, IconLockOpen2 } from "@tabler/icons-react";
import parsePhoneNumber from "libphonenumber-js";
import Link from "next/link";
import useSWR from "swr";
import CustomSuspense from "../ui/CustomSuspense";
import StatusAvatar from "./StatusAvatar";

const LockCard = ({ lock }) => {
  const swrData = useSWR(`/api/locks/${lock.id}/nuki`, fetcher);

  return (
    <div className="col-md-6 col-lg-4">
      <div className="card">
        <div className="card-body p-4 text-center">
          <CustomSuspense
            fallback={<StatusAvatar status="-1" />}
            isLoading={swrData.isLoading}
          >
            <StatusAvatar status={swrData.data?.nukiData?.status} />
          </CustomSuspense>
          <h3 className="m-0 mb-1">{lock.name}</h3>
          <div className="text-secondary">
            {lock.phoneNumber
              ? parsePhoneNumber(lock.phoneNumber).formatInternational()
              : "Pas de téléphone"}
          </div>
          <div className="mt-3 placeholder-glow">
            <CustomSuspense
              fallback={<div className="placeholder placeholder-s col-2"></div>}
              isLoading={swrData.isLoading}
            >
              {swrData.data?.success ? (
                swrData.data?.nukiData?.online ? (
                  <span className="badge bg-green-lt">
                    {swrData.data?.nukiData?.battery?.level} %
                  </span>
                ) : (
                  <span className="badge bg-red-lt">Hors ligne</span>
                )
              ) : (
                <span className="badge bg-red-lt">Serrure inconnue</span>
              )}
            </CustomSuspense>
          </div>
        </div>
        <div className="d-flex">
          <a
            href="#"
            className="card-btn"
            onClick={() => sendNukiAction(lock.id, 2)}
          >
            <IconLock className="icon me-2 text-muted icon-3" />
            Verrouiller
          </a>
          <a
            href="#"
            className="card-btn"
            onClick={() => sendNukiAction(lock.id, 1)}
          >
            <IconLockOpen2 className="icon me-2 text-muted icon-3" />
            Déverrouiller
          </a>
        </div>
        <div className="d-flex">
          <Link href={`/dashboard/locks/${lock.id}`} className="card-btn">
            <IconInfoCircle className="icon me-2 text-muted icon-3" />
            Plus d&apos;informations
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LockCard;
