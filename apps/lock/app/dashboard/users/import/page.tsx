import type { Metadata } from "next";
import ContentLayout from "@/components/ui/ContentLayout";
import { prisma } from "@repo/db";
import AddUsersBulk from "@/components/users/AddUsersBulk";

// Metadata

export const metadata: Metadata = {
  title: "Import d'utilisateurs en masse",
};

// ----------------------------

const AddUser = async () => {
  const groups = await prisma.group.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const locks = await prisma.lock.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  // Page data

  const pageData = {
    ariane: [
      { label: "lock.crf", href: "/dashboard" },
      { label: "Utilisateurs", href: "/dashboard/users" },
      {
        label: "Import d'utilisateurs en masse",
        href: "/dashboard/users/import",
      },
    ],
    title: "Import d'utilisateurs en masse",
    button: "",
    buttonIcon: undefined,
    buttonLink: "",
  };

  // DOM rendering

  return (
    <ContentLayout subHeaderProps={pageData}>
      <AddUsersBulk groups={groups} locks={locks} />
    </ContentLayout>
  );
};
export default AddUser;
