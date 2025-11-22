"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import clsx from "clsx";
import Select from "react-select";
import { selectStyle } from "@/app/utils/ui/actions";
import { onSubmit } from "@/app/utils/data/actions";
import ErrorDismissable from "@/components/ui/ErrorDismissable";

const AddUserForm = ({ groups }) => {
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
          null,
          "/dashboard/users",
        ),
      )}
    >
      <div className="row row-cards">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Nouvel utilisateur</h3>
            </div>
            <div className="card-body">
              <div className="row">
                {error && <ErrorDismissable error={error} />}

                <div className="col-xl-6 col-sm-12">
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
                </div>

                <div className="col-xl-6 col-sm-12">
                  <div className="mb-3">
                    <label className="form-label required">Groupe</label>
                    <Controller
                      control={control}
                      name="groupId"
                      render={({ field }) => (
                        <Select
                          onChange={(val) => field.onChange(val.value)}
                          options={optionsGroups}
                          placeholder="Sélectionner"
                          styles={selectStyle}
                          value={optionsGroups.find(
                            (c) => c.value === field.value,
                          )}
                          required
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="col-xl-6 col-sm-12">
                  <div className="mb-3">
                    <label className="form-label" htmlFor="email">
                      Adresse mail
                    </label>
                    <input
                      id="email"
                      type="email"
                      className={clsx(
                        "form-control",
                        errors.email && "is-invalid",
                      )}
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
                </div>

                <div className="col-xl-6 col-sm-12">
                  <div className="mb-3">
                    <label className="form-label">Téléphone</label>
                    <input
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
                          Le format doit être au format international, sans
                          espaces et sans tirets.
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-xl-6 col-sm-12">
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
              </div>
            </div>
            <div className="card-footer text-end">
              <button
                type="submit"
                className={clsx("btn btn-primary", isLoading && "btn-loading")}
                disabled={isLoading}
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default AddUserForm;
