import { revalidate } from "../api/actions";
import { toast } from "@/app/utils/ui/actions";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export async function logNumberToText(number) {
  switch (number) {
    case 1:
      return "Déverrouillage";
    case 2:
      return "Verrouillage";
    default:
      return "Action inconnue";
  }
}

export async function onSubmit(
  data,
  setIsLoading,
  setError,
  type,
  router,
  action,
  modalId,
  redirect = null,
) {
  setIsLoading(true);

  if (setError) {
    setError(null);
  }

  const formData = Object.fromEntries(
    Object.entries(data)
      .filter(([_, v]) => v !== "")
      .filter(([_, v]) => v !== null)
      .map(([k, v]) => [k, String(v)]),
  );

  let typeMsg = "";
  let feminine = false;

  switch (type) {
    case "users":
      typeMsg = "Utilisateur";
      break;
    case "locks":
      typeMsg = "Serrure";
      feminine = true;
      break;
    default:
      typeMsg = "Ressource inconnue";
      feminine = true;
      break;
  }

  try {
    const response = await fetch(
      `/api/${type}/${action === "PUT" ? formData.id : ""}`,
      {
        method: action,
        body: new URLSearchParams(formData),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    const data = await response.json();

    if (action === "POST") {
      if (!data.success) {
        setError(data.error.message);
      } else {
        if (modalId) {
          document.getElementById(modalId).click();
        }
        if (redirect) {
          revalidate(redirect);
          router.push(redirect);
        }
      }
    } else if (action === "PUT") {
      if (!data.success) {
        toast(true, data.error.message);
      } else {
        toast(false, `${typeMsg} modifié${feminine ? "e" : ""} avec succès`);
        document.getElementById(modalId).click();

        if (redirect) {
          revalidate(redirect);
          router.push(redirect);
        }
      }
    }
  } catch (error) {
    if (action === "POST") {
      setError(error.message);
    } else {
      toast(true, error.message);
    }
  } finally {
    setIsLoading(false);
  }
}

export async function onSubmitUsersBulk(data, setIsLoading, setError, router) {
  setIsLoading(true);

  if (setError) {
    setError(null);
  }

  const formData = new FormData();
  formData.append("file", data.file[0]);
  formData.append("groupId", data.groupId);
  formData.append("lockId", data.lockId);

  try {
    const response = await fetch(`/api/users/bulkAdd`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      setError(data.error.message);
    } else {
      revalidate("/dashboard/users");
      router.push("/dashboard/users");
    }
  } catch (error) {
    setError(error.message);
  } finally {
    setIsLoading(false);
  }
}

export async function generateMetadataCustom(
  id,
  isNumber,
  prismaType,
  prefix = "",
): Promise<Metadata> {
  let returnName: { name: string };

  try {
    returnName = await prismaType.findUniqueOrThrow({
      select: {
        name: true,
      },
      where: {
        id: isNumber ? Number(id) : id,
      },
    });
  } catch {
    redirect("/errors/404");
  }

  return {
    title: `${prefix ? prefix : ""}${returnName.name}`,
  };
}

export const checkNukiAction = async (
  requestId: string,
  lastTime: boolean = false,
) => {
  setTimeout(() => {
    const formData = new URLSearchParams();
    formData.append("apiSecret", process.env.API_SECRET || "");

    fetch(`/api/requests/${requestId}`, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
      .then(async (res) => {
        const data = await res.json();
        if (data.success) {
          if (data.request.success) {
            toast(false, "Action effectuée avec succès");
          } else if (data.request.success === false) {
            toast(
              true,
              "Erreur : " +
                (data.request.error === "42"
                  ? "Moteur bloqué, la porte n'est probablement pas claquée."
                  : "Inconnue"),
            );
          } else {
            if (!lastTime) {
              checkNukiAction(requestId, true);
            } else {
              toast(true, "La serrure n'a pas répondu à la demande.");
            }
          }
        } else {
          toast(true, data.error.message);
        }
      })
      .catch((err) => {
        toast(true, err.message);
      });
  }, 3500);
};

export const sendNukiAction = async (lockId: number, action: number) => {
  const formData = new URLSearchParams();
  formData.append("action", String(action));

  try {
    const response = await fetch(`/api/locks/${lockId}/nuki/action`, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = await response.json();

    if (!data.success) {
      toast(true, data.error.message);
    } else {
      toast(false, "Action envoyée avec succès");
      checkNukiAction(data.request.id);
    }
  } catch (error) {
    toast(true, error.message);
  }
};

export const fetcher = (...args: Parameters<typeof fetch>) =>
  fetch(...args).then((res) => res.json());
