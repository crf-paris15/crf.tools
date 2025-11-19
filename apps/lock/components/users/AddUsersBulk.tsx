"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import clsx from "clsx";
import Select from "react-select";
import { selectStyle } from "@/app/utils/ui/actions";
import { onSubmitUsersBulk } from "@/app/utils/data/actions";
import ErrorDismissable from "@/components/ui/ErrorDismissable";

const AddUsersBulk = ({ groups, locks }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const { control, register, handleSubmit } = useForm();

  const optionsGroups = groups.map((group) => ({
    value: group.id,
    label: group.name,
  }));

  const optionsLocks = locks.map((lock) => ({
    value: lock.id,
    label: lock.name,
  }));

  return (
    <form
      onSubmit={handleSubmit((data) =>
        onSubmitUsersBulk(data, setIsLoading, setError, router),
      )}
    >
      <div className="row row-cards">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Nouveaux utilisateurs</h3>
            </div>
            <div className="card-body">
              <div className="row">
                {error && <ErrorDismissable error={error} />}

                <div className="col-xl-6 col-sm-12">
                  <div className="mb-3">
                    <label className="form-label required" htmlFor="file">
                      Fichier CSV
                    </label>
                    <input
                      id="file"
                      type="file"
                      accept=".csv"
                      className="form-control"
                      {...register("file", { required: true })}
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
                    <label className="form-label required">Serrure</label>
                    <Controller
                      control={control}
                      name="lockId"
                      render={({ field }) => (
                        <Select
                          onChange={(val) => field.onChange(val.value)}
                          options={optionsLocks}
                          placeholder="Sélectionner"
                          styles={selectStyle}
                          value={optionsLocks.find(
                            (c) => c.value === field.value,
                          )}
                          required
                        />
                      )}
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

export default AddUsersBulk;
