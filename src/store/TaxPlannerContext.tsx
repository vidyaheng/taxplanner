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

const CURRENT_SCHEMA_VERSION = 6;

const initialState: TaxPlannerState = {
  schemaVersion:
  CURRENT_SCHEMA_VERSION,

  taxYear: 2569,

  income: emptyIncome,

  family: emptyFamily,

  deductions: emptyDeductions,

  planning: emptyPlanning,
};

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
            },
          }
        : migrated.family,

      schemaVersion: 6,
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

  resetPlanner: () => void;
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

  function resetPlanner() {
    dispatch({
      type: "RESET",
    });
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