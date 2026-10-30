"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";

import {
  DetailedOtherIncomeData,
  IncomeData,
  OtherIncomeKey,
} from "@/types/income";

import {
  FamilyData,
} from "@/types/family";

import {
  DeductionData,
} from "@/types/deductions";

import {
  PlanningData,
} from "@/types/planning";

export interface TaxPlannerState {
  schemaVersion: number;

  taxYear: number;

  income: IncomeData;

  family: FamilyData;

  deductions: DeductionData;

  planning: PlanningData;
}

const emptyDetailedOtherIncome:
  DetailedOtherIncomeData = {
  section40_3: [],

  section40_4Interest: [],

  section40_4Dividend: [],

  section40_5: [],

  section40_6: [],

  section40_7: [],

  section40_8: [],
};

const emptyIncome: IncomeData = {
  monthlySalary: 0,
  annualBonus: 0,
  otherEmploymentIncome: 0,

  section40_1TaxWithheld: 0,
  section40_2TaxWithheld: 0,

  hasOtherIncome: false,

  otherIncome: {
    commission: 0,
    rent: 0,
    professional: 0,
    business: 0,
    investment: 0,
    other: 0,
  },

  detailedOtherIncome: {
    ...emptyDetailedOtherIncome,
  },
};

const emptyFamily: FamilyData = {
  taxpayerAge65OrOlder: null,
  isThaiTaxResident: null,

  isThaiNational: null,

  seniorIncomeExemptionAllocation: {
    section40_1: 0,
    section40_2: 0,
    section40_3Annuity: 0,
    section40_3Rights: 0,
    section40_4Interest: 0,
    section40_4Dividend: 0,
    section40_5: 0,
    section40_6: 0,
    section40_7: 0,
    section40_8: 0,
  },

  maritalStatus: "single",

  spouseHasIncome: false,

  marriedFullTaxYear: false,

  children: [],

  parents: [],

  disabledDependents: [],

  pregnancies: [],
};

const emptyDeductions: DeductionData = {
  lifeInsurance: 0,
  healthInsuranceSelf: 0,
  spouseLifeInsurance: 0,
  parentHealthInsurance: 0,

  pensionInsurance: 0,

  providentFund: 0,
  gpf: 0,
  privateTeacherFund: 0,
  nsf: 0,
  rmf: 0,

  thaiEsg: 0,

  ltfToThaiEsgxTransferAmount: 0,

  socialSecurity: 0,
  homeLoanInterest: 0,

  pregnancyAndChildbirth: 0,

  socialEnterpriseInvestment: 0,

  solarRooftop: 0,
  artPurchase: 0,

  politicalDonation: 0,
  specialDonation: 0,
  generalDonation: 0,
};

const emptyPlanning: PlanningData = {
  lifeInsurance: 0,

  healthInsuranceSelf: 0,

  pensionInsurance: 0,

  rmf: 0,

  thaiEsg: 0,
};

const STORAGE_KEY =
  "thai-tax-planner-v0.1";

const CURRENT_SCHEMA_VERSION = 14;

const initialState: TaxPlannerState = {
  schemaVersion:
  CURRENT_SCHEMA_VERSION,

  taxYear: 2569,

  income: emptyIncome,

  family: emptyFamily,

  deductions: emptyDeductions,

  planning: emptyPlanning,
};

/** Persist a complete clean planner snapshot before navigation/reload. */
export function persistPlannerReset(
  storage: Pick<Storage, "setItem">
): void {
  storage.setItem(
    STORAGE_KEY,
    JSON.stringify(initialState)
  );
}

type Action =
  | {
      type: "SET_INCOME";
      payload: Partial<IncomeData>;
    }
  | {
      type: "SET_OTHER_INCOME";
      key: OtherIncomeKey;
      amount: number;
    }
  | {
      type: "SET_DETAILED_OTHER_INCOME";
      payload: Partial<DetailedOtherIncomeData>;
    }
  | {
      type: "SET_FAMILY";
      payload: Partial<FamilyData>;
    }
  | {
      type: "LOAD_STATE";
      payload: Partial<TaxPlannerState>;
    }
  | {
      type: "RESET";
    }
  | {
      type: "SET_DEDUCTIONS";
      payload: Partial<DeductionData>;
    }
  | {
      type: "SET_PLANNING";
      payload: Partial<PlanningData>;
    };

export function migrateStoredState(
  stored: Partial<TaxPlannerState>
): Partial<TaxPlannerState> {
  let migrated = { ...stored };

  const version =
    typeof stored.schemaVersion === "number"
      ? stored.schemaVersion
      : 0;

  if (version < 1) {
    migrated = {
      ...migrated,

      schemaVersion: 1,

      planning: {
        ...emptyPlanning,
        ...(migrated.planning ?? {}),
      },
    };
  }

  if (version < 2) {
    if (migrated.deductions) {
      const legacyDeductions = {
        ...migrated.deductions,
      } as DeductionData & {
        thaiEsgxCarryForward?: number;
      };

      delete legacyDeductions
        .thaiEsgxCarryForward;

      migrated = {
        ...migrated,

        deductions: {
          ...legacyDeductions,

          ltfToThaiEsgxTransferAmount: 0,
        },
      };
    }

    migrated = {
      ...migrated,
      schemaVersion: 2,
    };
  }

  if (version < 3) {
    if (migrated.family) {
      const legacyFamily = {
        ...migrated.family,
      } as FamilyData & {
        taxpayerBirthYearBE?:
          number | null;
      };

      const legacyBirthYear =
        legacyFamily
          .taxpayerBirthYearBE;

      const existingAgeStatus =
        legacyFamily
          .taxpayerAge65OrOlder;

      const existingTaxResident =
        legacyFamily
          .isThaiTaxResident;

      const taxpayerAge65OrOlder =
        typeof existingAgeStatus ===
        "boolean"
          ? existingAgeStatus
          : typeof legacyBirthYear ===
                "number" &&
              typeof migrated.taxYear ===
                "number"
            ? migrated.taxYear -
                legacyBirthYear >=
              65
            : null;

      delete legacyFamily
        .taxpayerBirthYearBE;

      migrated = {
        ...migrated,

        family: {
          ...legacyFamily,

          taxpayerAge65OrOlder,

          isThaiTaxResident:
            typeof existingTaxResident ===
            "boolean"
              ? existingTaxResident
              : null,
        },
      };
    }

    migrated = {
      ...migrated,
      schemaVersion: 3,
    };
  }

  if (version < 4) {
    migrated = {
      ...migrated,

      income: migrated.income
        ? {
            ...migrated.income,

            detailedOtherIncome: {
              ...emptyDetailedOtherIncome,

              ...(
                migrated.income
                  .detailedOtherIncome ?? {}
              ),
            },
          }
        : migrated.income,

      schemaVersion: 4,
    };
  }

  if (version < 5) {
    migrated = {
      ...migrated,

      family: migrated.family
        ? {
            ...migrated.family,

            seniorIncomeExemptionAllocation: {
              section40_1:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_1 ?? 0,

              section40_2:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_2 ?? 0,

              section40_3Annuity:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_3Annuity ?? 0,

              section40_3Rights:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_3Rights ?? 0,

              section40_4Interest: 0,
              section40_4Dividend: 0,
              section40_5: 0,
              section40_6: 0,
              section40_7: 0,
            },
          }
        : migrated.family,

      schemaVersion: 5,
    };
  }

  if (version < 6) {
    migrated = {
      ...migrated,

      family: migrated.family
        ? {
            ...migrated.family,

            seniorIncomeExemptionAllocation: {
              section40_1:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_1 ?? 0,

              section40_2:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_2 ?? 0,

              /*
              * schema 5 มี section40_3 รวมก้อนเดียว
              * จึงไม่เดาว่าเป็น annuity หรือ rights
              */
              section40_3Annuity: 0,
              section40_3Rights: 0,

              /*
              * field นี้ถูกเพิ่มภายหลัง
              * สำหรับ object shape ปัจจุบันให้เริ่มที่ 0
              */
              section40_4Interest: 0,
              section40_4Dividend: 0,
              section40_5: 0,
              section40_6: 0,
              section40_7: 0,
            },
          }
        : migrated.family,

      schemaVersion: 6,
    };
  }

  if (version < 7) {
    migrated = {
      ...migrated,

      family: migrated.family
        ? {
            ...migrated.family,

            seniorIncomeExemptionAllocation: {
              section40_1:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_1 ?? 0,

              section40_2:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_2 ?? 0,

              section40_3Annuity:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_3Annuity ?? 0,

              section40_3Rights:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_3Rights ?? 0,

              /*
              * schema 7 เพิ่ม allocation
              * สำหรับดอกเบี้ย 40(4)(ก)
              *
              * ข้อมูลเก่าไม่มีค่านี้
              * จึงเริ่มที่ 0 และไม่เดาให้ผู้ใช้
              */
              section40_4Interest: 0,
              section40_4Dividend: 0,
              section40_5: 0,
              section40_6: 0,
              section40_7: 0,
            },
          }
        : migrated.family,

      schemaVersion: 7,
    };
  }

  if (version < 8) {
    migrated = {
      ...migrated,
      family: migrated.family
        ? {
            ...migrated.family,
            seniorIncomeExemptionAllocation: {
              section40_1:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_1 ?? 0,

              section40_2:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_2 ?? 0,

              section40_3Annuity:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_3Annuity ?? 0,

              section40_3Rights:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_3Rights ?? 0,

              section40_4Interest:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_4Interest ?? 0,

              section40_4Dividend: 0,
              section40_5: 0,
              section40_6: 0,
              section40_7: 0,
            },
          }
        : migrated.family,

      schemaVersion: 8,
    };
  }

  if (version < 9) {
    migrated = {
      ...migrated,

      family: migrated.family
        ? {
            ...migrated.family,

            seniorIncomeExemptionAllocation: {
              section40_1:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_1 ?? 0,

              section40_2:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_2 ?? 0,

              section40_3Annuity:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_3Annuity ?? 0,

              section40_3Rights:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_3Rights ?? 0,

              section40_4Interest:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_4Interest ?? 0,

              section40_4Dividend:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_4Dividend ?? 0,

              /*
              * schema 9 เพิ่ม allocation
              * สำหรับรายได้ค่าเช่า 40(5)
              *
              * ข้อมูลเก่าไม่มีค่านี้
              * จึงเริ่มที่ 0 และไม่เดาให้ผู้ใช้
              */
              section40_5:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_5 ?? 0,
                  section40_6: 0,
                  section40_7: 0,
            },
          }
        : migrated.family,

      schemaVersion: 9,
    };
  }

  if (version < 10) {
    migrated = {
      ...migrated,

      family: migrated.family
        ? {
            ...migrated.family,

            seniorIncomeExemptionAllocation: {
              section40_1:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_1 ?? 0,

              section40_2:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_2 ?? 0,

              section40_3Annuity:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_3Annuity ?? 0,

              section40_3Rights:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_3Rights ?? 0,

              section40_4Interest:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_4Interest ?? 0,

              section40_4Dividend:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_4Dividend ?? 0,

              section40_5:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_5 ?? 0,

              section40_6: 0,
              section40_7: 0,
            },
          }
        : migrated.family,

      schemaVersion: 10,
    };
  }

  if (version < 11) {
    migrated = {
      ...migrated,

      family: migrated.family
        ? {
            ...migrated.family,

            seniorIncomeExemptionAllocation: {
              section40_1:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_1 ?? 0,

              section40_2:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_2 ?? 0,

              section40_3Annuity:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_3Annuity ?? 0,

              section40_3Rights:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_3Rights ?? 0,

              section40_4Interest:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_4Interest ?? 0,

              section40_4Dividend:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_4Dividend ?? 0,

              section40_5:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_5 ?? 0,

              section40_6:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_6 ?? 0,

              section40_7: 0,
            },
          }
        : migrated.family,

      schemaVersion: 11,
    };
  }

  if (version < 12) {
    migrated = {
      ...migrated,

      family: migrated.family
        ? {
            ...migrated.family,

            seniorIncomeExemptionAllocation: {
              section40_1:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_1 ?? 0,

              section40_2:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_2 ?? 0,

              section40_3Annuity:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_3Annuity ?? 0,

              section40_3Rights:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_3Rights ?? 0,

              section40_4Interest:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_4Interest ?? 0,

              section40_4Dividend:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_4Dividend ?? 0,

              section40_5:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_5 ?? 0,

              section40_6:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_6 ?? 0,

              section40_7:
                migrated.family
                  .seniorIncomeExemptionAllocation
                  ?.section40_7 ?? 0,

              /*
              * schema 12 เพิ่ม allocation
              * สำหรับรายได้ 40(8)
              *
              * ข้อมูลเก่าไม่มีค่านี้
              * จึงเริ่มที่ 0 และไม่เดาให้ผู้ใช้
              */
              section40_8: 0,
            },
          }
        : migrated.family,

      schemaVersion: 12,
    };
  }

  if (version < 13) {
    migrated = {
      ...migrated,

      income: migrated.income
        ? {
            ...migrated.income,

            /*
            * schema 13 เพิ่มภาษีหัก ณ ที่จ่าย
            * สำหรับ 40(1) และ 40(2)
            *
            * ข้อมูลเก่าไม่มีค่าเหล่านี้
            * จึงเริ่มที่ 0 และไม่เดาให้ผู้ใช้
            */
            section40_1TaxWithheld:
              migrated.income
                .section40_1TaxWithheld ?? 0,

            section40_2TaxWithheld:
              migrated.income
                .section40_2TaxWithheld ?? 0,
          }
        : migrated.income,

      schemaVersion: 13,
    };
  }

  if (version < 14) {
    migrated = {
      ...migrated,

      deductions: migrated.deductions
        ? {
            ...migrated.deductions,

            /*
            * schema 14 เพิ่มสิทธิ
            * Solar Rooftop และค่าซื้องานศิลปะ
            *
            * ข้อมูลเก่าไม่มีค่าเหล่านี้
            * จึงเริ่มที่ 0 และไม่เดาให้ผู้ใช้
            */
            solarRooftop:
              migrated.deductions
                .solarRooftop ?? 0,

            artPurchase:
              migrated.deductions
                .artPurchase ?? 0,
          }
        : migrated.deductions,

      schemaVersion: 14,
    };
  }

  return {
    ...migrated,

    schemaVersion: Math.max(
      version,
      CURRENT_SCHEMA_VERSION
    ),
  };
}    

function reducer(
  state: TaxPlannerState,
  action: Action
): TaxPlannerState {
  switch (action.type) {
    case "SET_INCOME":
      return {
        ...state,

        income: {
          ...state.income,
          ...action.payload,
        },
      };

    case "SET_OTHER_INCOME":
      return {
        ...state,

        income: {
          ...state.income,

          otherIncome: {
            ...state.income.otherIncome,
            [action.key]: action.amount,
          },
        },
      };

    case "SET_DETAILED_OTHER_INCOME":
      return {
        ...state,

        income: {
          ...state.income,

          detailedOtherIncome: {
            ...state.income.detailedOtherIncome,
            ...action.payload,
          },
        },
      };  

    case "SET_FAMILY":
      return {
        ...state,

        family: {
          ...state.family,
          ...action.payload,
        },
      };

    case "SET_DEDUCTIONS":
      return {
        ...state,

        deductions: {
          ...state.deductions,
          ...action.payload,
        },
      };
    case "SET_PLANNING":
      return {
        ...state,

        planning: {
          ...state.planning,
          ...action.payload,
        },
      };  

    case "LOAD_STATE": {
      const loaded = action.payload;

      return {
        ...state,
        ...loaded,

        income: {
          ...state.income,
          ...(loaded.income ?? {}),

          otherIncome: {
            ...state.income.otherIncome,
            ...(loaded.income?.otherIncome ?? {}),
          },

          detailedOtherIncome: {
            ...state.income.detailedOtherIncome,
            ...(loaded.income?.detailedOtherIncome ?? {}),
          },
        },

        family: {
          ...state.family,
          ...(loaded.family ?? {}),

          seniorIncomeExemptionAllocation: {
            ...state.family
              .seniorIncomeExemptionAllocation,

            ...(loaded.family
              ?.seniorIncomeExemptionAllocation ??
              {}),
          },


          children:
            loaded.family?.children ??
            state.family.children,

          parents:
            loaded.family?.parents ??
            state.family.parents,

          disabledDependents:
            loaded.family?.disabledDependents ??
            state.family.disabledDependents,

          pregnancies:
            loaded.family?.pregnancies ??
            state.family.pregnancies,
        },

        deductions: {
          ...state.deductions,
          ...(loaded.deductions ?? {}),
        },

        planning: {
          ...state.planning,
          ...(loaded.planning ?? {}),
        },
      };
    }

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

interface TaxPlannerContextValue {
  state: TaxPlannerState;

  setIncome: (
    values: Partial<IncomeData>
  ) => void;

  setOtherIncome: (
    key: OtherIncomeKey,
    amount: number
  ) => void;

  setDetailedOtherIncome: (
    payload: Partial<DetailedOtherIncomeData>
  ) => void;

  setFamily: (
    values: Partial<FamilyData>
  ) => void;

  setDeductions: (
    values: Partial<DeductionData>
  ) => void;

  setPlanning: (
    values: Partial<PlanningData>
  ) => void;

  resetPlanner: () => boolean;

  isHydrated: boolean;
}

const TaxPlannerContext =
  createContext<TaxPlannerContextValue | null>(
    null
  );

export function TaxPlannerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, dispatch] =
    useReducer(
      reducer,
      initialState
    );

  const [hydrated, setHydrated] =
    useState(false);

  useEffect(() => {
    try {
      const stored =
        window.localStorage.getItem(
          STORAGE_KEY
        );

      if (stored) {
        const parsed =
          JSON.parse(stored);

        const migrated =
          migrateStoredState(
            parsed
          );

        dispatch({
          type: "LOAD_STATE",
          payload: migrated,
        });
      }
    } catch (error) {
      console.error(
        "Unable to load Tax Planner data",
        error
      );
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
      );
    } catch (error) {
      console.error(
        "Unable to save Tax Planner data",
        error
      );
    }
  }, [state, hydrated]);

  function setIncome(
    values: Partial<IncomeData>
  ) {
    dispatch({
      type: "SET_INCOME",
      payload: values,
    });
  }

  function setOtherIncome(
    key: OtherIncomeKey,
    amount: number
  ) {
    dispatch({
      type: "SET_OTHER_INCOME",
      key,
      amount,
    });
  }

  function setDetailedOtherIncome(
    values: Partial<DetailedOtherIncomeData>
  ) {
    dispatch({
      type: "SET_DETAILED_OTHER_INCOME",
      payload: values,
    });
  }

  function setFamily(
    values: Partial<FamilyData>
  ) {
    dispatch({
      type: "SET_FAMILY",
      payload: values,
    });
  }

  function setDeductions(
    values: Partial<DeductionData>
  ) {
    dispatch({
      type: "SET_DEDUCTIONS",
      payload: values,
    });
  }

  function resetPlanner(): boolean {
    // Do not overwrite saved user data before hydration has finished.
    if (!hydrated) return false;

    try {
      // Write synchronously so reloading immediately cannot revive old data.
      persistPlannerReset(window.localStorage);
    } catch (error) {
      console.error(
        "Unable to reset Tax Planner data",
        error
      );
      return false;
    }

    dispatch({
      type: "RESET",
    });
    return true;
  }

  function setPlanning(
    values: Partial<PlanningData>
  ) {
    dispatch({
      type: "SET_PLANNING",
      payload: values,
    });
  }

  return (
    <TaxPlannerContext.Provider
      value={{
        state,
        setIncome,
        setOtherIncome,
        setDetailedOtherIncome,
        setFamily,
        setDeductions,
        setPlanning,
        resetPlanner,
        isHydrated: hydrated,
      }}
    >
      {children}
    </TaxPlannerContext.Provider>
  );
}

export function useTaxPlanner() {
  const context =
    useContext(TaxPlannerContext);

  if (!context) {
    throw new Error(
      "useTaxPlanner must be used inside TaxPlannerProvider"
    );
  }

  return context;
}