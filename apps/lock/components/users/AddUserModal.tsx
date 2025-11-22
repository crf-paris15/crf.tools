"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import clsx from "clsx";
import Select from "react-select";
import { selectStyle } from "@/app/utils/ui/actions";
import { onSubmit } from "@/app/utils/data/actions";
import { IconUserPlus } from "@tabler/icons-react";
import ErrorDismissable from "../ui/ErrorDismissable";

const AddUserModal = ({ lockId, groups }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const optionsGroups = groups.map((group) => ({
    value: group.id,
    label: group.name,
  }));

  return (
    <form
      onSubmit={handleSubmit((data) =>
        onSubmit(
          data,
          setIsLoading,
          setError,
          "users",
          router,
          "POST",
          "close-modal-add-user",
          `/dashboard/locks/${lockId}/authorizations/add`,
        ),
      )}
    >
      <div className="modal" id="modal-add-user">
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Nouvel utilisateur</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              {error && <ErrorDismissable error={error} />}

              <div className="mb-3">
                <label className="form-label required" htmlFor="name">
                  Nom complet
                </label>
                <input
                  id="name"
                  type="text"
                  className="form-control"
                  placeholder="John Doe"
                  {...register("name", { required: true })}
                />
              </div>

              <div className="mb-3">
                <label className="form-label required">Groupe</label>
                <Controller
                  control={control}
                  defaultValue={groups.id}
                  name="groupId"
                  render={({ field }) => (
                    <Select
                      onChange={(val) => field.onChange(val.value)}
                      options={optionsGroups}
                      placeholder="Sélectionner"
                      styles={selectStyle}
                      value={optionsGroups.find((c) => c.value === field.value)}
                      required
                    />
                  )}
                />
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="email">
                  Adresse mail
                </label>
                <input
                  id="email"
                  type="email"
                  className={clsx("form-control", errors.email && "is-invalid")}
                  placeholder="john.doe@croix-rouge.fr"
                  {...register("email", {
                    pattern: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
                  })}
                />
                <div className="invalid-feedback">
                  {errors.email?.type === "pattern" && (
                    <>Le format doit être une adresse email valide.</>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="phone">
                  Numéro de téléphone
                </label>
                <input
                  id="phone"
                  type="tel"
                  className={clsx(
                    "form-control",
                    errors.phoneNumber && "is-invalid",
                  )}
                  placeholder="+33601020304"
                  {...register("phoneNumber", {
                    pattern: /^(\+)[0-9]{1,15}$/,
                  })}
                />
                <div className="invalid-feedback">
                  {errors.phoneNumber?.type === "pattern" && (
                    <>
                      Le format doit être au format international, sans espaces
                      et sans tirets.
                    </>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="nukiAccountId">
                  ID du compte Nuki
                </label>
                <input
                  id="nukiAccountId"
                  type="text"
                  className="form-control"
                  placeholder="1234567890abcdef12345678"
                  {...register("nukiAccountId")}
                />
              </div>
            </div>
            <div className="modal-footer">
              <a
                href="#"
                className="btn btn-link link-secondary"
                id="close-modal-add-user"
                data-bs-dismiss="modal"
              >
                Annuler
              </a>
              <button
                type="submit"
                className={clsx(
                  "btn btn-primary ms-auto",
                  isLoading && "btn-loading",
                )}
                disabled={isLoading}
              >
                <IconUserPlus className="icon" />
                Ajouter
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default AddUserModal;
