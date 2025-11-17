"use server";

import { prisma } from "@repo/db";

export const validatePhoneNumberAccess = async (from, to) => {
  let lock;

  try {
    lock = await prisma.lock.findFirstOrThrow({
      select: {
        id: true,
      },
      where: {
        phoneNumber: to,
      },
    });
  } catch {
    return {
      success: false,
      error: {
        message: "Le numéro de téléphone n'est pas attribué à une serrure.",
      },
      status: 404,
    };
  }

  let user;

  try {
    user = await prisma.user.findFirstOrThrow({
      select: {
        id: true,
      },
      where: {
        phoneNumber: from,
      },
    });
  } catch {
    prisma.log.create({
      data: {
        lock: {
          connect: { id: lock.id },
        },
        details: from,
      },
    });

    return {
      success: false,
      error: { message: "Numéro de téléphone non autorisé." },
      status: 401,
    };
  }

  try {
    const authorization = await prisma.authorization.findFirstOrThrow({
      where: {
        lockId: lock.id,
        user: {
          id: user.id,
        },
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

    return {
      success: true,
      lockId: lock.id,
      userId: user.id,
      authorizationId: authorization.id,
      error: null,
      status: 200,
    };
  } catch {
    prisma.log.create({
      data: {
        user: { connect: { id: user.id } },
        lock: { connect: { id: lock.id } },
      },
    });

    return {
      success: false,
      error: { message: "Numéro de téléphone non autorisé à cette date." },
      status: 401,
    };
  }
};
