"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

import {
  useTaxPlanner,
} from "@/store/TaxPlannerContext";

import PlanningStepper
  from "@/components/planning/PlanningStepper";

import { TAX_RULES_2569 } from "@/tax-rules/2569";

import {
  aggregateForeignIncome,
} from "@/lib/tax/foreign-income-aggregate";

import type {
  OtherIncomeKey,
  Section40_1ForeignIncomeData,
  Section40_2ForeignIncomeData,
  Section40_3IncomeData,
  Section40_3RightsIncomeData,
  Section40_3AnnuityIncomeData,
  Section40_4InterestIncomeData,
  Section40_4DividendIncomeData,
  Section40_5RentalIncomeData,
  Section40_6ProfessionalIncomeData,
  Section40_7ContractIncomeData,
  Section40_8BusinessIncomeData,
} from "@/types/income";

import ForeignIncomeCommonFields
  from "@/components/ForeignIncomeCommonFields";

import ForeignTaxCreditReviewFields
  from "@/components/ForeignTaxCreditReviewFields";

interface OtherIncomeDefinition {
  id: OtherIncomeKey;
  label: string;
  description: string;
}

const otherIncomeDefinitions:
  OtherIncomeDefinition[] = [
  {
    id: "commission",
    label: "ค่านายหน้า / ค่าตอบแทน",
    description:
      "รายได้จากค่านายหน้า ค่าธรรมเนียม หรือค่าตอบแทนอื่น",
  },
  {
    id: "rent",
    label: "ค่าเช่า",
    description:
      "รายได้จากการให้เช่าบ้าน อาคาร ที่ดิน หรือทรัพย์สิน",
  },
  {
    id: "professional",
    label: "วิชาชีพอิสระ",
    description:
      "รายได้จากการประกอบวิชาชีพอิสระ",
  },
  {
    id: "business",
    label: "ธุรกิจ / ค้าขาย",
    description:
      "รายได้จากธุรกิจ การค้า หรือกิจการอื่น",
  },
  {
    id: "other",
    label: "รายได้อื่น",
    description:
      "รายได้อื่นที่ยังไม่ได้ระบุไว้ด้านบน",
  },
];

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "th-TH"
  ).format(value || 0);
}

function parseNumber(
  value: string
) {
  return (
    Number(
      value.replace(/,/g, "")
    ) || 0
  );
}

export default function IncomePage() {
  const {
    state,
    setIncome,
    setOtherIncome,
    setDetailedOtherIncome,
  } = useTaxPlanner();

  const income = state.income;

  const section40_1ForeignIncomes =
    income.section40_1ForeignIncome ?? [];

  const section40_2ForeignIncomes =
    income.section40_2ForeignIncome ?? [];

  const foreignIncomeAggregate =
    useMemo(
      () =>
        aggregateForeignIncome({
          income,
          filingTaxYear:
            state.taxYear,
        }),
      [
        income,
        state.taxYear,
      ]
    );

  const hasForeignIncomeData =
    foreignIncomeAggregate.items.length > 0;

  const [
    foreignIncomeManuallyOpened,
    setForeignIncomeManuallyOpened,
  ] = useState(false);

  const showForeignIncomeHub =
    hasForeignIncomeData ||
    foreignIncomeManuallyOpened;
  
  const [
    manuallySelectedForeignIncomeTypes,
    setManuallySelectedForeignIncomeTypes,
  ] = useState<string[]>([]);

  function hasForeignIncomeType(
    section: string
  ) {
    return (
      foreignIncomeAggregate.items.some(
        (item) =>
          item.section === section
      ) ||
      manuallySelectedForeignIncomeTypes.includes(
        section
      )
    );
  }

  function toggleForeignIncomeType(
    section: string
  ) {
    const hasSavedData =
      foreignIncomeAggregate.items.some(
        (item) =>
          item.section === section
      );

    /*
    * ถ้ามีข้อมูลจริงอยู่แล้ว
    * ไม่ให้ปิดจาก selector
    * ต้องลบรายการจริงแทน
    */
    if (hasSavedData) {
      return;
    }

    setManuallySelectedForeignIncomeTypes(
      (current) =>
        current.includes(section)
          ? current.filter(
              (item) =>
                item !== section
            )
          : [...current, section]
    );
  }

  function addSection40_1ForeignIncome() {
    const newItem:
      Section40_1ForeignIncomeData = {
        id: crypto.randomUUID(),

        amount: 0,

        foreignSource: {
          country: "",

          incomeTaxYear:
            state.taxYear,

          remittedToThailandThisTaxYear:
            0,

          foreignIncomeTaxPaid:
            0,

          isThaiTaxResidentInIncomeYear:
            null,
        },
      };

    setIncome({
      section40_1ForeignIncome: [
        ...section40_1ForeignIncomes,
        newItem,
      ],
    });
  }

  function updateSection40_1ForeignIncome(
    id: string,
    values:
      Partial<Section40_1ForeignIncomeData>
  ) {
    setIncome({
      section40_1ForeignIncome:
        section40_1ForeignIncomes.map(
          (item) =>
            item.id === id
              ? {
                  ...item,
                  ...values,
                }
              : item
        ),
    });
  }

  function removeSection40_1ForeignIncome(
    id: string
  ) {
    setIncome({
      section40_1ForeignIncome:
        section40_1ForeignIncomes.filter(
          (item) =>
            item.id !== id
        ),
    });
  }

  function addSection40_2ForeignIncome() {
  const newItem:
    Section40_2ForeignIncomeData = {
      id: crypto.randomUUID(),

      amount: 0,

      foreignSource: {
        country: "",

        incomeTaxYear:
          state.taxYear,

        remittedToThailandThisTaxYear:
          0,

        foreignIncomeTaxPaid:
          0,

        isThaiTaxResidentInIncomeYear:
          null,
      },
    };

  setIncome({
    section40_2ForeignIncome: [
      ...section40_2ForeignIncomes,
      newItem,
    ],
  });
}

function updateSection40_2ForeignIncome(
  id: string,
  values:
    Partial<Section40_2ForeignIncomeData>
) {
  setIncome({
    section40_2ForeignIncome:
      section40_2ForeignIncomes.map(
        (item) =>
          item.id === id
            ? {
                ...item,
                ...values,
              }
            : item
      ),
  });
}

function removeSection40_2ForeignIncome(
  id: string
) {
  setIncome({
    section40_2ForeignIncome:
      section40_2ForeignIncomes.filter(
        (item) =>
          item.id !== id
      ),
  });
}

  const rightsIncome =
    income.detailedOtherIncome.section40_3.find(
      (item) =>
        item.incomeType === "rights" &&
        !item.foreignSource
    ) as Section40_3RightsIncomeData | undefined;

  const foreignRightsIncomes =
    income.detailedOtherIncome.section40_3.filter(
      (
        item
      ): item is Section40_3RightsIncomeData =>
        item.incomeType === "rights" &&
        !!item.foreignSource
    );

  const annuityIncome =
    income.detailedOtherIncome.section40_3.find(
      (item) =>
        item.incomeType === "annuity" &&
        !item.foreignSource
    ) as Section40_3AnnuityIncomeData | undefined;

  const foreignAnnuityIncomes =
    income.detailedOtherIncome.section40_3.filter(
      (
        item
      ): item is Section40_3AnnuityIncomeData =>
        item.incomeType === "annuity" &&
        !!item.foreignSource
    );

  const interestIncome =
    income.detailedOtherIncome.section40_4Interest.find(
      (item) =>
        !item.foreignSource
    ) ?? null;

  const foreignInterestIncomes =
    income.detailedOtherIncome.section40_4Interest.filter(
      (item) =>
        !!item.foreignSource
    );

  function updateSection40_3Item(
    item: Section40_3IncomeData
  ) {
    const existing =
      income.detailedOtherIncome.section40_3;

    const next = existing.some(
      (current) =>
        current.id === item.id
    )
      ? existing.map((current) =>
          current.id === item.id
            ? item
            : current
        )
      : [...existing, item];

    setDetailedOtherIncome({
      section40_3: next,
    });
  }

  function updateRightsIncome(
    values:
      Partial<Section40_3RightsIncomeData>
  ) {
    const current =
      rightsIncome ?? {
        id: "rights-domestic-1",
        incomeType: "rights" as const,
        amount: 0,
        expenseMethod:
          "standard" as const,
        actualExpense: 0,
        taxWithheld: 0,
      };

    updateSection40_3Item({
      ...current,
      ...values,
    });
  }

  function addForeignRightsIncome() {
    const newItem:
      Section40_3RightsIncomeData = {
        id: crypto.randomUUID(),
        incomeType: "rights",
        amount: 0,

        expenseMethod: "standard",
        actualExpense: 0,
        taxWithheld: 0,

        foreignSource: {
          country: "",

          incomeTaxYear:
            state.taxYear,

          remittedToThailandThisTaxYear:
            0,

          foreignIncomeTaxPaid:
            0,

          isThaiTaxResidentInIncomeYear:
            null,
        },
      };

    updateSection40_3Item(
      newItem
    );
  }

  function updateForeignRightsIncome(
    id: string,
    values:
      Partial<Section40_3RightsIncomeData>
  ) {
    const current =
      foreignRightsIncomes.find(
        (item) =>
          item.id === id
      );

    if (!current) {
      return;
    }

    updateSection40_3Item({
      ...current,
      ...values,
    });
  }

  function removeForeignRightsIncome(
    id: string
  ) {
    setDetailedOtherIncome({
      section40_3:
        income.detailedOtherIncome.section40_3.filter(
          (item) =>
            item.id !== id
        ),
    });
  }

  function updateAnnuityIncome(
    values:
      Partial<Section40_3AnnuityIncomeData>
  ) {
    const current =
      annuityIncome ?? {
        id: "annuity-1",
        incomeType: "annuity" as const,
        amount: 0,
        taxWithheld: 0,
      };

    updateSection40_3Item({
      ...current,
      ...values,
    });
  }

  function addForeignAnnuityIncome() {
    const newItem:
      Section40_3AnnuityIncomeData = {
        id: crypto.randomUUID(),

        incomeType: "annuity",

        amount: 0,

        taxWithheld: 0,

        foreignSource: {
          country: "",

          incomeTaxYear:
            state.taxYear,

          remittedToThailandThisTaxYear:
            0,

          foreignIncomeTaxPaid:
            0,

          isThaiTaxResidentInIncomeYear:
            null,
        },
      };

    updateSection40_3Item(
      newItem
    );
  }

  function updateForeignAnnuityIncome(
    id: string,
    values:
      Partial<Section40_3AnnuityIncomeData>
  ) {
    const current =
      foreignAnnuityIncomes.find(
        (item) =>
          item.id === id
      );

    if (!current) {
      return;
    }

    updateSection40_3Item({
      ...current,
      ...values,
    });
  }

  function removeForeignAnnuityIncome(
    id: string
  ) {
    setDetailedOtherIncome({
      section40_3:
        income.detailedOtherIncome.section40_3.filter(
          (item) =>
            item.id !== id
        ),
    });
  }

  function selectInterestTaxTreatment(
    taxTreatment:
      Section40_4InterestIncomeData["taxTreatment"]
  ) {
    const current =
      interestIncome ?? {
        id: "interest-1",
        amount: 0,
        taxWithheld: 0,
        taxTreatment,
      };

    const existing =
      income.detailedOtherIncome
        .section40_4Interest;

    const next = existing.some(
      (item) =>
        item.id === current.id
    )
      ? existing.map((item) =>
          item.id === current.id
            ? {
                ...current,
                taxTreatment,
              }
            : item
        )
      : [
          ...existing,
          {
            ...current,
            taxTreatment,
          },
        ];

    setDetailedOtherIncome({
      section40_4Interest: next,
    });
  }

  function updateInterestIncome(
    values: Partial<Section40_4InterestIncomeData>
  ) {
    if (!interestIncome) {
      return;
    }

    setDetailedOtherIncome({
      section40_4Interest:
        income.detailedOtherIncome.section40_4Interest.map(
          (item) =>
            item.id === interestIncome.id
              ? {
                  ...item,
                  ...values,
                }
              : item
        ),
    });
  }

  function addForeignInterestIncome() {
    const newItem:
      Section40_4InterestIncomeData = {
        id: crypto.randomUUID(),

        amount: 0,

        /*
        * Foreign interest ที่นำมาคำนวณ
        * ใช้เส้นทาง include
        * ไม่ใช่ Final Tax ของดอกเบี้ยในประเทศ
        */
        taxTreatment: "include",

        /*
        * Thai withholding tax
        * ไม่มีในรายการต่างประเทศ
        */
        taxWithheld: 0,

        foreignSource: {
          country: "",

          incomeTaxYear:
            state.taxYear,

          remittedToThailandThisTaxYear:
            0,

          foreignIncomeTaxPaid:
            0,

          isThaiTaxResidentInIncomeYear:
            null,
        },
      };

    setDetailedOtherIncome({
      section40_4Interest: [
        ...income.detailedOtherIncome
          .section40_4Interest,
        newItem,
      ],
    });
  }

  function updateForeignInterestIncome(
    id: string,
    values:
      Partial<Section40_4InterestIncomeData>
  ) {
    const current =
      foreignInterestIncomes.find(
        (item) =>
          item.id === id
      );

    if (!current) {
      return;
    }

    setDetailedOtherIncome({
      section40_4Interest:
        income.detailedOtherIncome.section40_4Interest.map(
          (item) =>
            item.id === id
              ? {
                  ...current,
                  ...values,
                }
              : item
        ),
    });
  }

  function removeForeignInterestIncome(
    id: string
  ) {
    setDetailedOtherIncome({
      section40_4Interest:
        income.detailedOtherIncome.section40_4Interest.filter(
          (item) =>
            item.id !== id
        ),
    });
  }

  const dividendIncome =
    income.detailedOtherIncome.section40_4Dividend.find(
      (item) =>
        !item.foreignSource
    ) ?? null;

  const foreignDividendIncomes =
    income.detailedOtherIncome.section40_4Dividend.filter(
      (item) =>
        !!item.foreignSource
    );

  const rentalIncome =
    income.detailedOtherIncome.section40_5.find(
      (item) =>
        !item.foreignSource
    ) ?? null;

  const foreignRentalIncomes =
    income.detailedOtherIncome.section40_5.filter(
      (item) =>
        !!item.foreignSource
    );

  const professionalIncome =
    income.detailedOtherIncome.section40_6.find(
      (item) =>
        !item.foreignSource
    ) ?? null;

  const foreignProfessionalIncomes =
    income.detailedOtherIncome.section40_6.filter(
      (item) =>
        !!item.foreignSource
    );

  const contractIncome =
    income.detailedOtherIncome.section40_7.find(
      (item) =>
        !item.foreignSource
    ) ?? null;

  const foreignContractIncomes =
    income.detailedOtherIncome.section40_7.filter(
      (item) =>
        !!item.foreignSource
    );

  const businessIncomes =
    income.detailedOtherIncome.section40_8.filter(
      (item) =>
        !item.foreignSource
    );

  const foreignBusinessIncomes =
    income.detailedOtherIncome.section40_8.filter(
      (item) =>
        !!item.foreignSource
    );

  const rentalStandardRate =
    rentalIncome?.assetType
      ? TAX_RULES_2569
          .otherIncomeExpenses
          .section40_5Rental
          .standardRates[
            rentalIncome.assetType
          ]
      : null;  

  const professionalStandardRate =
    professionalIncome?.professionalType
      ? TAX_RULES_2569
          .otherIncomeExpenses
          .section40_6Professional
          .standardRates[
            professionalIncome
              .professionalType
          ]
      : null;

  const contractStandardRate =
    TAX_RULES_2569
      .otherIncomeExpenses
      .section40_7Contract
      .standardRate;

  const businessRule =
    TAX_RULES_2569
      .otherIncomeExpenses
      .section40_8Business;

  const businessStandardRate =
    businessRule.standardRate;

  const performerFirstTierLimit =
    businessRule.performer
      .firstTierLimit;

  const performerFirstTierRate =
    businessRule.performer
      .firstTierRate;

  const performerExcessRate =
    businessRule.performer
      .excessRate;

  const performerMaxExpense =
    businessRule.performer
      .maxExpense;

function selectDividendTaxTreatment(
  taxTreatment:
    Section40_4DividendIncomeData["taxTreatment"]
) {
  const current =
    dividendIncome ?? {
      id: "dividend-1",
      amount: 0,
      taxWithheld: 0,
      dividendTaxCredit: 0,
      taxTreatment,
    };

  const existing =
    income.detailedOtherIncome
      .section40_4Dividend;

  const next = existing.some(
    (item) =>
      item.id === current.id
  )
    ? existing.map((item) =>
        item.id === current.id
          ? {
              ...current,
              taxTreatment,
            }
          : item
      )
    : [
        ...existing,
        {
          ...current,
          taxTreatment,
        },
      ];

  setDetailedOtherIncome({
    section40_4Dividend: next,
  });
}

function updateDividendIncome(
  values: Partial<Section40_4DividendIncomeData>
) {
  if (!dividendIncome) {
    return;
  }

  setDetailedOtherIncome({
    section40_4Dividend:
      income.detailedOtherIncome.section40_4Dividend.map(
        (item) =>
          item.id === dividendIncome.id
            ? {
                ...item,
                ...values,
              }
            : item
      ),
  });
}

function addForeignDividendIncome() {
  const newItem:
    Section40_4DividendIncomeData = {
      id: crypto.randomUUID(),

      amount: 0,

      /*
       * Foreign dividend ที่นำมาคำนวณ
       * ใช้เส้นทาง include
       * ไม่ใช่ Final Tax ของเงินปันผลในประเทศ
       */
      taxTreatment: "include",

      /*
       * Thai withholding tax
       * ไม่มีในรายการต่างประเทศ
       */
      taxWithheld: 0,

      /*
       * เครดิตภาษีเงินปันผลแบบไทย
       * ไม่ใช้กับ foreign dividend
       */
      dividendTaxCredit: 0,

      foreignSource: {
        country: "",

        incomeTaxYear:
          state.taxYear,

        remittedToThailandThisTaxYear:
          0,

        foreignIncomeTaxPaid:
          0,

        isThaiTaxResidentInIncomeYear:
          null,
      },
    };

  setDetailedOtherIncome({
    section40_4Dividend: [
      ...income.detailedOtherIncome
        .section40_4Dividend,
      newItem,
    ],
  });
}

function updateForeignDividendIncome(
  id: string,
  values:
    Partial<Section40_4DividendIncomeData>
) {
  const current =
    foreignDividendIncomes.find(
      (item) =>
        item.id === id
    );

  if (!current) {
    return;
  }

  setDetailedOtherIncome({
    section40_4Dividend:
      income.detailedOtherIncome.section40_4Dividend.map(
        (item) =>
          item.id === id
            ? {
                ...current,
                ...values,
              }
            : item
      ),
  });
}

function removeForeignDividendIncome(
  id: string
) {
  setDetailedOtherIncome({
    section40_4Dividend:
      income.detailedOtherIncome.section40_4Dividend.filter(
        (item) =>
          item.id !== id
      ),
  });
}

function updateRentalIncome(
  values:
    Partial<Section40_5RentalIncomeData>
) {
  const current =
    rentalIncome ?? {
      id: "rental-1",

      amount: 0,
      taxWithheld: 0,
      energyEfficientInvestment: 0,

      assetType: null,

      expenseMethod:
        "standard" as const,

      actualExpense: 0,

      isSublease: false,

      subleaseRentPaid: 0,
    };

  const existing =
    income.detailedOtherIncome
      .section40_5;

  const next = existing.some(
    (item) =>
      item.id === current.id
  )
    ? existing.map((item) =>
        item.id === current.id
          ? {
              ...current,
              ...values,
            }
          : item
      )
    : [
        ...existing,
        {
          ...current,
          ...values,
        },
      ];

  setDetailedOtherIncome({
    section40_5: next,
  });
}

function addForeignRentalIncome() {
  const newItem:
    Section40_5RentalIncomeData = {
      id: crypto.randomUUID(),

      amount: 0,

      /*
       * Thai withholding tax
       * รายการต่างประเทศเริ่มต้นเป็น 0
       */
      taxWithheld: 0,

      energyEfficientInvestment: 0,

      assetType: null,

      expenseMethod: "standard",

      actualExpense: 0,

      isSublease: false,

      subleaseRentPaid: 0,

      foreignSource: {
        country: "",

        incomeTaxYear:
          state.taxYear,

        remittedToThailandThisTaxYear:
          0,

        foreignIncomeTaxPaid:
          0,

        isThaiTaxResidentInIncomeYear:
          null,
      },
    };

  setDetailedOtherIncome({
    section40_5: [
      ...income.detailedOtherIncome
        .section40_5,
      newItem,
    ],
  });
}

function updateForeignRentalIncome(
  id: string,
  values:
    Partial<Section40_5RentalIncomeData>
) {
  const current =
    foreignRentalIncomes.find(
      (item) =>
        item.id === id
    );

  if (!current) {
    return;
  }

  setDetailedOtherIncome({
    section40_5:
      income.detailedOtherIncome.section40_5.map(
        (item) =>
          item.id === id
            ? {
                ...current,
                ...values,
              }
            : item
      ),
  });
}

function removeForeignRentalIncome(
  id: string
) {
  setDetailedOtherIncome({
    section40_5:
      income.detailedOtherIncome.section40_5.filter(
        (item) =>
          item.id !== id
      ),
  });
}

function updateProfessionalIncome(
  values:
    Partial<Section40_6ProfessionalIncomeData>
) {
  const current =
    professionalIncome ?? {
      id: "professional-1",

      amount: 0,
      taxWithheld: 0,
      energyEfficientInvestment: 0,

      professionalType: null,

      expenseMethod:
        "standard" as const,

      actualExpense: 0,
    };

  const existing =
    income.detailedOtherIncome
      .section40_6;

  const next = existing.some(
    (item) =>
      item.id === current.id
  )
    ? existing.map((item) =>
        item.id === current.id
          ? {
              ...current,
              ...values,
            }
          : item
      )
    : [
        ...existing,
        {
          ...current,
          ...values,
        },
      ];

  setDetailedOtherIncome({
    section40_6: next,
  });
}

function addForeignProfessionalIncome() {
  const newItem:
    Section40_6ProfessionalIncomeData = {
      id: crypto.randomUUID(),

      amount: 0,

      /*
       * Thai withholding tax
       * รายการต่างประเทศเริ่มต้นเป็น 0
       */
      taxWithheld: 0,

      energyEfficientInvestment: 0,

      professionalType: null,

      expenseMethod: "standard",

      actualExpense: 0,

      foreignSource: {
        country: "",

        incomeTaxYear:
          state.taxYear,

        remittedToThailandThisTaxYear:
          0,

        foreignIncomeTaxPaid:
          0,

        isThaiTaxResidentInIncomeYear:
          null,
      },
    };

  setDetailedOtherIncome({
    section40_6: [
      ...income.detailedOtherIncome
        .section40_6,
      newItem,
    ],
  });
}

function updateForeignProfessionalIncome(
  id: string,
  values:
    Partial<Section40_6ProfessionalIncomeData>
) {
  const current =
    foreignProfessionalIncomes.find(
      (item) =>
        item.id === id
    );

  if (!current) {
    return;
  }

  setDetailedOtherIncome({
    section40_6:
      income.detailedOtherIncome.section40_6.map(
        (item) =>
          item.id === id
            ? {
                ...current,
                ...values,
              }
            : item
      ),
  });
}

function removeForeignProfessionalIncome(
  id: string
) {
  setDetailedOtherIncome({
    section40_6:
      income.detailedOtherIncome.section40_6.filter(
        (item) =>
          item.id !== id
      ),
  });
}

function updateContractIncome(
  values:
    Partial<Section40_7ContractIncomeData>
) {
  const current =
    contractIncome ?? {
      id: "contract-1",

      amount: 0,
      taxWithheld: 0,
      energyEfficientInvestment: 0,

      expenseMethod:
        "standard" as const,

      actualExpense: 0,
    };

  const existing =
    income.detailedOtherIncome
      .section40_7;

  const next = existing.some(
    (item) =>
      item.id === current.id
  )
    ? existing.map((item) =>
        item.id === current.id
          ? {
              ...current,
              ...values,
            }
          : item
      )
    : [
        ...existing,
        {
          ...current,
          ...values,
        },
      ];

  setDetailedOtherIncome({
    section40_7: next,
  });
}

function addForeignContractIncome() {
  const newItem:
    Section40_7ContractIncomeData = {
      id: crypto.randomUUID(),

      amount: 0,

      /*
       * Thai withholding tax
       * รายการต่างประเทศเริ่มต้นเป็น 0
       */
      taxWithheld: 0,

      energyEfficientInvestment: 0,

      expenseMethod: "standard",

      actualExpense: 0,

      foreignSource: {
        country: "",

        incomeTaxYear:
          state.taxYear,

        remittedToThailandThisTaxYear:
          0,

        foreignIncomeTaxPaid:
          0,

        isThaiTaxResidentInIncomeYear:
          null,
      },
    };

  setDetailedOtherIncome({
    section40_7: [
      ...income.detailedOtherIncome
        .section40_7,
      newItem,
    ],
  });
}

function updateForeignContractIncome(
  id: string,
  values:
    Partial<Section40_7ContractIncomeData>
) {
  const current =
    foreignContractIncomes.find(
      (item) =>
        item.id === id
    );

  if (!current) {
    return;
  }

  setDetailedOtherIncome({
    section40_7:
      income.detailedOtherIncome.section40_7.map(
        (item) =>
          item.id === id
            ? {
                ...current,
                ...values,
              }
            : item
      ),
  });
}

function removeForeignContractIncome(
  id: string
) {
  setDetailedOtherIncome({
    section40_7:
      income.detailedOtherIncome.section40_7.filter(
        (item) =>
          item.id !== id
      ),
  });
}

function addBusinessIncome() {
  const newItem:
    Section40_8BusinessIncomeData = {
      id: crypto.randomUUID(),

      amount: 0,
      taxWithheld: 0,
      energyEfficientInvestment: 0,

      category: null,

      expenseMethod: "standard",

      actualExpense: 0,

      activityCode: null,
    };

  setDetailedOtherIncome({
    section40_8: [
      ...income.detailedOtherIncome.section40_8,
      newItem,
    ],
  });
}

function updateBusinessIncome(
  id: string,
  values:
    Partial<Section40_8BusinessIncomeData>
) {
  setDetailedOtherIncome({
    section40_8:
      income.detailedOtherIncome.section40_8.map(
        (item) =>
          item.id === id
            ? {
                ...item,
                ...values,
              }
            : item
      ),
  });
}

function removeBusinessIncome(
  id: string
) {
  setDetailedOtherIncome({
    section40_8:
      income.detailedOtherIncome.section40_8.filter(
        (item) =>
          item.id !== id
      ),
  });
}

function addForeignBusinessIncome() {
  const newItem:
    Section40_8BusinessIncomeData = {
      id: crypto.randomUUID(),

      amount: 0,

      /*
       * Thai withholding tax
       * รายการต่างประเทศเริ่มต้นเป็น 0
       */
      taxWithheld: 0,

      energyEfficientInvestment: 0,

      category: null,

      expenseMethod: "standard",

      actualExpense: 0,

      activityCode: null,

      foreignSource: {
        country: "",

        incomeTaxYear:
          state.taxYear,

        remittedToThailandThisTaxYear:
          0,

        foreignIncomeTaxPaid:
          0,

        isThaiTaxResidentInIncomeYear:
          null,
      },
    };

  setDetailedOtherIncome({
    section40_8: [
      ...income.detailedOtherIncome
        .section40_8,
      newItem,
    ],
  });
}

function updateForeignBusinessIncome(
  id: string,
  values:
    Partial<Section40_8BusinessIncomeData>
) {
  const current =
    foreignBusinessIncomes.find(
      (item) =>
        item.id === id
    );

  if (!current) {
    return;
  }

  setDetailedOtherIncome({
    section40_8:
      income.detailedOtherIncome.section40_8.map(
        (item) =>
          item.id === id
            ? {
                ...current,
                ...values,
              }
            : item
      ),
  });
}

function removeForeignBusinessIncome(
  id: string
) {
  setDetailedOtherIncome({
    section40_8:
      income.detailedOtherIncome.section40_8.filter(
        (item) =>
          item.id !== id
      ),
  });
}

  const annualSalary =
    income.monthlySalary * 12;

  const legacyRentIncome =
    income.hasOtherIncome
      ? Math.max(
          0,
          income.otherIncome.rent ?? 0
        )
      : 0;

  const legacyProfessionalIncome =
    income.hasOtherIncome
      ? Math.max(
          0,
          income.otherIncome.professional ?? 0
        )
      : 0;

  const legacyBusinessIncome =
    income.hasOtherIncome
      ? Math.max(
          0,
          income.otherIncome.business ?? 0
        )
      : 0;

  const totalOtherIncome =
    useMemo(() => {
      if (!income.hasOtherIncome) {
        return 0;
      }

      return otherIncomeDefinitions.reduce(
        (total, item) => {
          if (
            item.id === "rent" ||
            item.id === "professional" ||
            item.id === "business"
          ) {
            return total;
          }

          return (
            total +
            (income.otherIncome[item.id] ?? 0)
          );
        },
        0
      );
    }, [
      income.hasOtherIncome,
      income.otherIncome,
    ]);

  const domesticSection40_3Income =
    income.hasOtherIncome
      ? (rightsIncome &&
        !rightsIncome.foreignSource
          ? Math.max(
              0,
              rightsIncome.amount
            )
          : 0) +
        (annuityIncome &&
        !annuityIncome.foreignSource
          ? Math.max(
              0,
              annuityIncome.amount
            )
          : 0)
      : 0;

  const taxableSection40_3ForeignIncome =
    foreignIncomeAggregate
      .taxableBySection
      .section40_3Rights +
    foreignIncomeAggregate
      .taxableBySection
      .section40_3Annuity;

  const totalSection40_3Income =
    domesticSection40_3Income +
    taxableSection40_3ForeignIncome;

  const taxableSection40_4InterestForeignIncome =
    foreignIncomeAggregate
      .taxableBySection
      .section40_4Interest;

  const totalInterestIncome =
    (income.hasOtherIncome &&
    interestIncome?.taxTreatment ===
      "include"
      ? interestIncome.amount
      : 0) +
    taxableSection40_4InterestForeignIncome;

  const taxableSection40_4DividendForeignIncome =
  foreignIncomeAggregate
    .taxableBySection
    .section40_4Dividend;

  const totalDividendIncome =
    (income.hasOtherIncome &&
    dividendIncome?.taxTreatment ===
      "include"
      ? dividendIncome.amount
      : 0) +
    taxableSection40_4DividendForeignIncome;

  const taxableSection40_5ForeignIncome =
    foreignIncomeAggregate
      .taxableBySection
      .section40_5;

  const totalRentalIncome =
    (income.hasOtherIncome
      ? rentalIncome?.amount ?? 0
      : 0) +
    taxableSection40_5ForeignIncome;

  const taxableSection40_6ForeignIncome =
    foreignIncomeAggregate
      .taxableBySection
      .section40_6;

  const totalProfessionalIncome =
    (income.hasOtherIncome
      ? professionalIncome?.amount ?? 0
      : 0) +
    taxableSection40_6ForeignIncome; 

  const taxableSection40_7ForeignIncome =
    foreignIncomeAggregate
      .taxableBySection
      .section40_7;

  const totalContractIncome =
    (income.hasOtherIncome
      ? contractIncome?.amount ?? 0
      : 0) +
    taxableSection40_7ForeignIncome;

  const taxableForeignBusinessIncomes =
    foreignBusinessIncomes.filter(
      (item) => {
        const aggregateItem =
          foreignIncomeAggregate.items.find(
            (current) =>
              current.section ===
                "section40_8" &&
              current.id === item.id
          );

        return (
          aggregateItem?.isComplete ===
            true &&
          aggregateItem.isTaxable &&
          aggregateItem.taxableRemittance >
            0
        );
      }
    );

  const conflictingBusinessActivityKeys =
    useMemo(() => {
      const methods =
        new Map<
          string,
          Set<
            Section40_8BusinessIncomeData["expenseMethod"]
          >
        >();

      for (
        const item of [
          ...(income.hasOtherIncome
            ? businessIncomes
            : []),
          ...taxableForeignBusinessIncomes,
        ]
      ) {
        if (
          item.amount <= 0 ||
          !item.category
        ) {
          continue;
        }

        const activityCode =
          item.activityCode?.trim() ||
          "__unspecified__";

        const key =
          `${item.category}:${activityCode}`;

        const existing =
          methods.get(key) ??
          new Set<
            Section40_8BusinessIncomeData["expenseMethod"]
          >();

        existing.add(
          item.expenseMethod
        );

        methods.set(
          key,
          existing
        );
      }

      return new Set(
        [...methods.entries()]
          .filter(
            ([, expenseMethods]) =>
              expenseMethods.size > 1
          )
          .map(([key]) => key)
      );
    }, [
      income.hasOtherIncome,
      businessIncomes,
      taxableForeignBusinessIncomes,
    ]);    

  const taxableSection40_8ForeignIncome =
    foreignIncomeAggregate
      .taxableBySection
      .section40_8;

  const totalBusinessIncome =
    (income.hasOtherIncome
      ? businessIncomes.reduce(
          (total, item) =>
            total +
            Math.max(
              0,
              item.amount
            ),
          0
        )
      : 0) +
    taxableSection40_8ForeignIncome;

  const totalSection40_1ForeignIncome =
    section40_1ForeignIncomes.reduce(
      (total, item) =>
        total +
        Math.max(0, item.amount),
      0
    );

  const taxableSection40_1ForeignIncome =
    foreignIncomeAggregate
      .taxableBySection
      .section40_1;

  const totalSection40_2ForeignIncome =
  section40_2ForeignIncomes.reduce(
    (total, item) =>
      total +
      Math.max(0, item.amount),
    0
  );

  const taxableSection40_2ForeignIncome =
    foreignIncomeAggregate
      .taxableBySection
      .section40_2;

  const shouldShowOtherIncomeSummary =
    income.hasOtherIncome ||
    taxableSection40_3ForeignIncome > 0 ||
    taxableSection40_4InterestForeignIncome > 0 ||
    taxableSection40_4DividendForeignIncome > 0 ||
    taxableSection40_5ForeignIncome > 0 ||
    taxableSection40_6ForeignIncome > 0 ||
    taxableSection40_7ForeignIncome > 0 ||
    taxableSection40_8ForeignIncome > 0;

  const totalIncome =
    annualSalary +
    income.annualBonus +
    income.otherEmploymentIncome +
    taxableSection40_1ForeignIncome +
    taxableSection40_2ForeignIncome +
    totalOtherIncome +
    legacyRentIncome +
    legacyProfessionalIncome +
    totalSection40_3Income +
    totalInterestIncome +
    totalDividendIncome +
    totalRentalIncome +
    totalProfessionalIncome +
    legacyBusinessIncome +
    totalContractIncome +
    totalBusinessIncome;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-10">

        <header className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="text-xl font-bold text-slate-900"
            >
              Tax Planner
            </Link>

            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
              ปีภาษี {state.taxYear}
            </div>
          </div>

          <div className="mt-7">
            <PlanningStepper
              currentStep={1}
            />
          </div>
        </header>

        <div className="grid gap-6 min-[960px]:grid-cols-[minmax(0,1fr)_320px] min-[960px]:items-start">

          <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:p-8">

            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              รายได้ของคุณ
            </h1>

            <p className="mt-2 text-slate-500">
              เริ่มจากรายได้ที่ได้รับตลอดปี
              ระบบจะนำไปคำนวณค่าใช้จ่ายและภาษีให้อัตโนมัติ
            </p>

            <div className="mt-8">
              <h2 className="text-lg font-semibold text-slate-900">
                เงินเดือนและรายได้จากงานประจำ
              </h2>

              <div className="mt-5 grid gap-5 md:grid-cols-2">

                <MoneyInput
                  label="เงินเดือนต่อเดือน"
                  value={
                    income.monthlySalary
                  }
                  onChange={(value) =>
                    setIncome({
                      monthlySalary:
                        value,
                    })
                  }
                />

                <MoneyInput
                  label="โบนัสทั้งปี"
                  value={
                    income.annualBonus
                  }
                  onChange={(value) =>
                    setIncome({
                      annualBonus:
                        value,
                    })
                  }
                />
              </div>

              <div className="mt-5">

                <MoneyInput
                  label="รายได้จากงานประจำอื่น ๆ ตลอดปี"
                  description="เช่น ค่าตำแหน่ง ค่าตอบแทน หรือรายได้อื่นจากนายจ้าง"
                  value={
                    income.otherEmploymentIncome
                  }
                  onChange={(value) =>
                    setIncome({
                      otherEmploymentIncome:
                        value,
                    })
                  }
                />

              </div>

              <div className="mt-5">
                <MoneyInput
                  label="ภาษีหัก ณ ที่จ่ายจากเงินได้ 40(1)"
                  description="กรอกยอดภาษีที่ถูกหักจริงทั้งปีตามหนังสือรับรองหรือข้อมูลจากนายจ้าง"
                  value={
                    income.section40_1TaxWithheld ?? 0
                  }
                  onChange={(value) =>
                    setIncome({
                      section40_1TaxWithheld:
                        value,
                    })
                  }
                />
              </div>

              {annualSalary > 0 && (
                <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  เงินเดือนรวมทั้งปี{" "}
                  <strong>
                    {formatNumber(
                      annualSalary
                    )}{" "}
                    บาท
                  </strong>
                </div>
              )}

              <div className="mt-7 border-t border-slate-100 pt-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      มีรายได้จากต่างประเทศหรือไม่?
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      หากมี ระบบจะแสดงเฉพาะประเภทรายได้ต่างประเทศที่คุณเลือก
                    </p>
                  </div>

                  <div className="flex rounded-xl bg-slate-100 p-1">
                    <button
                      type="button"
                      disabled={hasForeignIncomeData}
                      onClick={() =>
                        setForeignIncomeManuallyOpened(false)
                      }
                      className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
                        !showForeignIncomeHub
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500"
                      } ${
                        hasForeignIncomeData
                          ? "cursor-not-allowed opacity-50"
                          : ""
                      }`}
                    >
                      ไม่มี
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setForeignIncomeManuallyOpened(true)
                      }
                      className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
                        showForeignIncomeHub
                          ? "bg-white text-violet-700 shadow-sm"
                          : "text-slate-500"
                      }`}
                    >
                      มี
                    </button>
                  </div>
                </div>

                {hasForeignIncomeData && (
                  <p className="mt-3 text-sm text-violet-600">
                    มีข้อมูลรายได้จากต่างประเทศที่บันทึกไว้แล้ว
                  </p>
                )}
              </div>

              {showForeignIncomeHub && (
                <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50/30 p-4 sm:p-5">
                  <div className="font-semibold text-slate-900">
                    เลือกประเภทรายได้จากต่างประเทศ
                  </div>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    เลือกได้มากกว่า 1 ประเภท
                    ระบบจะแสดงเฉพาะช่องกรอกของประเภทที่เลือก
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      {
                        id: "section40_1",
                        label: "40(1)",
                        description:
                          "เงินเดือน / ค่าจ้าง",
                      },
                      {
                        id: "section40_2",
                        label: "40(2)",
                        description:
                          "ค่านายหน้า / ค่าตอบแทน",
                      },
                      {
                        id: "section40_3Rights",
                        label: "40(3)",
                        description:
                          "ค่าลิขสิทธิ์ / ค่าสิทธิ",
                      },
                      {
                        id: "section40_3Annuity",
                        label: "40(3)",
                        description:
                          "เงินปี / เงินรายปีจากต่างประเทศ",
                      },
                      {
                        id: "section40_4Interest",
                        label: "40(4)(ก)",
                        description:
                          "ดอกเบี้ยจากต่างประเทศ",
                      },
                      {
                        id: "section40_4Dividend",
                        label: "40(4)(ข)",
                        description:
                          "เงินปันผลจากต่างประเทศ",
                      },
                      {
                        id: "section40_5",
                        label: "40(5)",
                        description:
                          "ค่าเช่าจากต่างประเทศ",
                      },
                      {
                        id: "section40_6",
                        label: "40(6)",
                        description:
                          "วิชาชีพอิสระจากต่างประเทศ",
                      },
                      {
                        id: "section40_7",
                        label: "40(7)",
                        description:
                          "รายได้จากการรับเหมาจากต่างประเทศ",
                      },
                      {
                        id: "section40_8",
                        label: "40(8)",
                        description:
                          "ธุรกิจ / การค้า / กิจการอื่นจากต่างประเทศ",
                      },
                    ].map((option) => {
                      const selected =
                        hasForeignIncomeType(
                          option.id
                        );

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            toggleForeignIncomeType(
                              option.id
                            )
                          }
                          className={`rounded-xl border px-4 py-4 text-left transition ${
                            selected
                              ? "border-violet-500 bg-white text-violet-800 shadow-sm"
                              : "border-slate-200 bg-white text-slate-600 hover:border-violet-300"
                          }`}
                        >
                          <div className="font-semibold">
                            {option.label}
                          </div>

                          <div className="mt-1 text-sm">
                            {option.description}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

          {showForeignIncomeHub &&
            hasForeignIncomeType("section40_1") && (
              <div className="mt-7 border-t border-slate-100 pt-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      รายได้จากต่างประเทศ 40(1)
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      เช่น เงินเดือนหรือค่าจ้างจากนายจ้างในต่างประเทศ
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      addSection40_1ForeignIncome
                    }
                    className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                  >
                    + เพิ่มรายได้ต่างประเทศ
                  </button>
                </div>

                {section40_1ForeignIncomes.length ===
                  0 && (
                  <div className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-400">
                    ยังไม่มีรายได้ 40(1)
                    จากต่างประเทศ
                  </div>
                )}

                {section40_1ForeignIncomes.length >
                  0 && (
                  <div className="mt-4 space-y-4">
                    {section40_1ForeignIncomes.map(
                      (item, index) => {
                        const taxability =
                          foreignIncomeAggregate.items.find(
                            (aggregateItem) =>
                              aggregateItem.section ===
                                "section40_1" &&
                              aggregateItem.id ===
                                item.id
                          );

                        return (
                          <div
                            key={item.id}
                          className="rounded-2xl border border-blue-100 bg-blue-50/30 p-4 sm:p-5"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="font-medium text-slate-800">
                              รายการที่ {index + 1}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeSection40_1ForeignIncome(
                                  item.id
                                )
                              }
                              className="text-sm font-medium text-rose-600 transition hover:text-rose-700"
                            >
                              ลบรายการ
                            </button>
                          </div>

                          <ForeignIncomeCommonFields
                            amount={item.amount}
                            foreignSource={item.foreignSource}
                            filingTaxYear={state.taxYear}
                            taxability={taxability}
                            onAmountChange={(value) =>
                              updateSection40_1ForeignIncome(
                                item.id,
                                {
                                  amount: value,
                                }
                              )
                            }
                            onForeignSourceChange={(values) =>
                              updateSection40_1ForeignIncome(
                                item.id,
                                {
                                  foreignSource: {
                                    ...item.foreignSource,
                                    ...values,
                                  },
                                }
                              )
                            }
                          />

                          <ForeignTaxCreditReviewFields
                            foreignSource={item.foreignSource}
                            taxability={taxability}
                            onForeignSourceChange={(values) =>
                              updateSection40_1ForeignIncome(
                                item.id,
                                {
                                  foreignSource: {
                                    ...item.foreignSource,
                                    ...values,
                                  },
                                }
                              )
                            }
                          />                      
                        </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
              )}
            </div>
            

            <div className="mt-9 border-t border-slate-100 pt-8">

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    มีรายได้ประเภทอื่นหรือไม่?
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    เช่น ค่าเช่า ค่านายหน้า
                    วิชาชีพอิสระ ธุรกิจ
                    หรือรายได้จากการลงทุน
                  </p>
                </div>

                <div className="flex rounded-xl bg-slate-100 p-1">

                  <button
                    type="button"
                    onClick={() =>
                      setIncome({
                        hasOtherIncome:
                          false,
                      })
                    }
                    className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
                      !income.hasOtherIncome
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    ไม่มี
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setIncome({
                        hasOtherIncome:
                          true,
                      })
                    }
                    className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
                      income.hasOtherIncome
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    มี
                  </button>
                </div>
              </div>

          {showForeignIncomeHub &&
            hasForeignIncomeType("section40_2") && (
              <div className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50/30 p-4 sm:p-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <div className="font-semibold text-slate-900">
                      รายได้จากต่างประเทศ 40(2)
                    </div>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      เช่น ค่านายหน้า ค่าธรรมเนียม
                      หรือค่าตอบแทนจากผู้จ่ายในต่างประเทศ
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      addSection40_2ForeignIncome
                    }
                    className="rounded-xl border border-cyan-200 bg-white px-4 py-2 text-sm font-medium text-cyan-700 transition hover:bg-cyan-50"
                  >
                    + เพิ่มรายได้ต่างประเทศ
                  </button>
                </div>

                {section40_2ForeignIncomes.length ===
                  0 && (
                  <div className="mt-4 rounded-xl border border-dashed border-cyan-200 bg-white px-4 py-4 text-sm text-slate-400">
                    ยังไม่มีรายได้ 40(2)
                    จากต่างประเทศ
                  </div>
                )}

                {section40_2ForeignIncomes.length >
                  0 && (
                  <div className="mt-4 space-y-4">
                    {section40_2ForeignIncomes.map(
                      (item, index) => {
                        const taxability =
                          foreignIncomeAggregate.items.find(
                            (aggregateItem) =>
                              aggregateItem.section ===
                                "section40_2" &&
                              aggregateItem.id ===
                                item.id
                          );

                        return (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-cyan-100 bg-white p-4 sm:p-5"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="font-medium text-slate-800">
                              รายการที่ {index + 1}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeSection40_2ForeignIncome(
                                  item.id
                                )
                              }
                              className="text-sm font-medium text-rose-600 transition hover:text-rose-700"
                            >
                              ลบรายการ
                            </button>
                          </div>

                          <ForeignIncomeCommonFields
                            amount={item.amount}
                            foreignSource={item.foreignSource}
                            filingTaxYear={state.taxYear}
                            taxability={taxability}
                            onAmountChange={(value) =>
                              updateSection40_2ForeignIncome(
                                item.id,
                                {
                                  amount: value,
                                }
                              )
                            }
                            onForeignSourceChange={(values) =>
                              updateSection40_2ForeignIncome(
                                item.id,
                                {
                                  foreignSource: {
                                    ...item.foreignSource,
                                    ...values,
                                  },
                                }
                              )
                            }
                          />

                          <ForeignTaxCreditReviewFields
                            foreignSource={item.foreignSource}
                            taxability={taxability}
                            onForeignSourceChange={(values) =>
                              updateSection40_2ForeignIncome(
                                item.id,
                                {
                                  foreignSource: {
                                    ...item.foreignSource,
                                    ...values,
                                  },
                                }
                              )
                            }
                          />                                            
                        </div>                       
                        );
                      }
                    )}
                  </div>
                )}
              </div>
          )}

                      {showForeignIncomeHub &&
                        hasForeignIncomeType(
                          "section40_3Rights"
                        ) && (
                          <div className="rounded-2xl border border-violet-200 bg-violet-50/30 p-4 sm:p-5">
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                              <div>
                                <div className="font-semibold text-slate-900">
                                  รายได้จากต่างประเทศ 40(3)
                                  - ค่าลิขสิทธิ์ / ค่าสิทธิ
                                </div>

                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                  เช่น ค่าลิขสิทธิ์
                                  ค่าสิทธิ หรือสิทธิอย่างอื่น
                                  ที่ได้รับจากต่างประเทศ
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={
                                  addForeignRightsIncome
                                }
                                className="rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-50"
                              >
                                + เพิ่มรายได้ต่างประเทศ
                              </button>
                            </div>

                            {foreignRightsIncomes.length ===
                              0 && (
                              <div className="mt-4 rounded-xl border border-dashed border-violet-200 bg-white px-4 py-4 text-sm text-slate-400">
                                ยังไม่มีรายได้ 40(3)
                                ค่าลิขสิทธิ์ / ค่าสิทธิ
                                จากต่างประเทศ
                              </div>
                            )}

                            {foreignRightsIncomes.length > 0 && (
                              <div className="mt-4 space-y-4">
                                {foreignRightsIncomes.map(
                                  (item, index) => {
                                    const taxability =
                                      foreignIncomeAggregate.items.find(
                                        (aggregateItem) =>
                                          aggregateItem.section ===
                                            "section40_3Rights" &&
                                          aggregateItem.id ===
                                            item.id
                                      );

                                    return (
                                      <div
                                        key={item.id}
                                        className="rounded-2xl border border-violet-100 bg-white p-4 sm:p-5"
                                      >
                                        <div className="flex items-center justify-between gap-4">
                                          <div className="font-medium text-slate-800">
                                            รายการที่ {index + 1}
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              removeForeignRightsIncome(
                                                item.id
                                              )
                                            }
                                            className="text-sm font-medium text-rose-600 transition hover:text-rose-700"
                                          >
                                            ลบรายการ
                                          </button>
                                        </div>

                                        <ForeignIncomeCommonFields
                                          amount={item.amount}
                                          foreignSource={
                                            item.foreignSource!
                                          }
                                          filingTaxYear={
                                            state.taxYear
                                          }
                                          taxability={taxability}
                                          onAmountChange={(value) =>
                                            updateForeignRightsIncome(
                                              item.id,
                                              {
                                                amount: value,
                                              }
                                            )
                                          }
                                          onForeignSourceChange={(
                                            values
                                          ) =>
                                            updateForeignRightsIncome(
                                              item.id,
                                              {
                                                foreignSource: {
                                                  ...item.foreignSource!,
                                                  ...values,
                                                },
                                              }
                                            )
                                          }
                                        />

                                        <div className="mt-5">
                                          <div className="text-sm font-medium text-slate-700">
                                            วิธีหักค่าใช้จ่าย
                                          </div>

                                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                updateForeignRightsIncome(
                                                  item.id,
                                                  {
                                                    expenseMethod:
                                                      "standard",
                                                  }
                                                )
                                              }
                                              className={`rounded-xl border px-4 py-3 text-left transition ${
                                                item.expenseMethod ===
                                                "standard"
                                                  ? "border-violet-500 bg-violet-50 text-violet-800"
                                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                              }`}
                                            >
                                              <div className="font-medium">
                                                หักค่าใช้จ่ายแบบเหมา
                                              </div>
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() =>
                                                updateForeignRightsIncome(
                                                  item.id,
                                                  {
                                                    expenseMethod:
                                                      "actual",
                                                  }
                                                )
                                              }
                                              className={`rounded-xl border px-4 py-3 text-left transition ${
                                                item.expenseMethod ===
                                                "actual"
                                                  ? "border-violet-500 bg-violet-50 text-violet-800"
                                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                              }`}
                                            >
                                              <div className="font-medium">
                                                หักค่าใช้จ่ายตามจริง
                                              </div>
                                            </button>
                                          </div>
                                        </div>

                                        {item.expenseMethod ===
                                          "actual" && (
                                          <div className="mt-5">
                                            <MoneyInput
                                              label="ค่าใช้จ่ายตามจริง"
                                              description="กรอกค่าใช้จ่ายตามจริงของเงินได้จากค่าลิขสิทธิ์หรือค่าสิทธิรายการนี้"
                                              value={
                                                item.actualExpense
                                              }
                                              onChange={(value) =>
                                                updateForeignRightsIncome(
                                                  item.id,
                                                  {
                                                    actualExpense:
                                                      value,
                                                  }
                                                )
                                              }
                                            />
                                          </div>
                                        )}

                                        {item.expenseMethod ===
                                          "actual" &&
                                          taxability?.isComplete &&
                                          taxability.isTaxable &&
                                          taxability.taxableRemittance >
                                            0 &&
                                          taxability.taxableRemittance <
                                            item.amount && (
                                            <div className="mt-5">
                                              <MoneyInput
                                                label="ค่าใช้จ่ายตามจริงที่เกี่ยวกับยอดที่นำเข้าไทย"
                                                description="กรอกเฉพาะค่าใช้จ่ายที่เกี่ยวข้องกับส่วนของเงินได้ที่นำเข้าไทย ระบบจะไม่เฉลี่ยค่าใช้จ่ายจากรายได้ทั้งก้อนให้อัตโนมัติ"
                                                value={
                                                  item.foreignSource
                                                    ?.expenseAttributableToRemittance ??
                                                  0
                                                }
                                                onChange={(value) =>
                                                  updateForeignRightsIncome(
                                                    item.id,
                                                    {
                                                      foreignSource: {
                                                        ...item.foreignSource!,
                                                        expenseAttributableToRemittance:
                                                          value,
                                                      },
                                                    }
                                                  )
                                                }
                                              />
                                            </div>
                                        )}

                                        <ForeignTaxCreditReviewFields
                                          foreignSource={item.foreignSource!}
                                          taxability={taxability}
                                          onForeignSourceChange={(values) =>
                                            updateForeignRightsIncome(
                                              item.id,
                                              {
                                                foreignSource: {
                                                  ...item.foreignSource!,
                                                  ...values,
                                                },
                                              }
                                            )
                                          }
                                        />
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            )}
                          </div>
                        )}

              {showForeignIncomeHub &&
                hasForeignIncomeType(
                  "section40_3Annuity"
                ) && (
                  <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50/30 p-4 sm:p-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <div className="font-semibold text-slate-900">
                          รายได้จากต่างประเทศ 40(3) - เงินปี / เงินรายปี
                        </div>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          เงินได้ที่มีลักษณะเป็นเงินปีหรือเงินรายปี
                          ที่ได้รับจากแหล่งเงินได้ในต่างประเทศ
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={
                          addForeignAnnuityIncome
                        }
                        className="rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-50"
                      >
                        + เพิ่มรายได้ต่างประเทศ
                      </button>
                    </div>

                    {foreignAnnuityIncomes.length ===
                      0 && (
                      <div className="mt-4 rounded-xl border border-dashed border-violet-200 bg-white px-4 py-4 text-sm text-slate-400">
                        ยังไม่มีรายได้ 40(3)
                        ประเภทเงินปี / เงินรายปี
                        จากต่างประเทศ
                      </div>
                    )}

                    {foreignAnnuityIncomes.length >
                      0 && (
                      <div className="mt-4 space-y-4">
                        {foreignAnnuityIncomes.map(
                          (item, index) => {
                            const taxability =
                              foreignIncomeAggregate.items.find(
                                (aggregateItem) =>
                                  aggregateItem.section ===
                                    "section40_3Annuity" &&
                                  aggregateItem.id ===
                                    item.id
                              );

                            return (
                              <div
                                key={item.id}
                                className="rounded-2xl border border-violet-100 bg-white p-4 sm:p-5"
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div className="font-medium text-slate-800">
                                    รายการที่ {index + 1}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeForeignAnnuityIncome(
                                        item.id
                                      )
                                    }
                                    className="text-sm font-medium text-rose-600 transition hover:text-rose-700"
                                  >
                                    ลบรายการ
                                  </button>
                                </div>

                                <ForeignIncomeCommonFields
                                  amount={item.amount}
                                  foreignSource={
                                    item.foreignSource!
                                  }
                                  filingTaxYear={
                                    state.taxYear
                                  }
                                  taxability={taxability}
                                  onAmountChange={(value) =>
                                    updateForeignAnnuityIncome(
                                      item.id,
                                      {
                                        amount: value,
                                      }
                                    )
                                  }
                                  onForeignSourceChange={(
                                    values
                                  ) =>
                                    updateForeignAnnuityIncome(
                                      item.id,
                                      {
                                        foreignSource: {
                                          ...item.foreignSource!,
                                          ...values,
                                        },
                                      }
                                    )
                                  }
                                />

                                <ForeignTaxCreditReviewFields
                                  foreignSource={
                                    item.foreignSource!
                                  }
                                  taxability={taxability}
                                  onForeignSourceChange={(
                                    values
                                  ) =>
                                    updateForeignAnnuityIncome(
                                      item.id,
                                      {
                                        foreignSource: {
                                          ...item.foreignSource!,
                                          ...values,
                                        },
                                      }
                                    )
                                  }
                                />
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
              )}

              {showForeignIncomeHub &&
                hasForeignIncomeType(
                  "section40_4Interest"
                ) && (
                  <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/30 p-4 sm:p-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <div className="font-semibold text-slate-900">
                          รายได้จากต่างประเทศ 40(4)(ก) - ดอกเบี้ย
                        </div>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          เช่น ดอกเบี้ยเงินฝาก
                          หรือดอกเบี้ยจากแหล่งเงินได้ในต่างประเทศ
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={
                          addForeignInterestIncome
                        }
                        className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                      >
                        + เพิ่มรายได้ต่างประเทศ
                      </button>
                    </div>

                    {foreignInterestIncomes.length ===
                      0 && (
                      <div className="mt-4 rounded-xl border border-dashed border-blue-200 bg-white px-4 py-4 text-sm text-slate-400">
                        ยังไม่มีรายได้ดอกเบี้ย 40(4)(ก)
                        จากต่างประเทศ
                      </div>
                    )}

                    {foreignInterestIncomes.length >
                      0 && (
                      <div className="mt-4 space-y-4">
                        {foreignInterestIncomes.map(
                          (item, index) => {
                            const taxability =
                              foreignIncomeAggregate.items.find(
                                (aggregateItem) =>
                                  aggregateItem.section ===
                                    "section40_4Interest" &&
                                  aggregateItem.id ===
                                    item.id
                              );

                            return (
                              <div
                                key={item.id}
                                className="rounded-2xl border border-blue-100 bg-white p-4 sm:p-5"
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div className="font-medium text-slate-800">
                                    รายการที่ {index + 1}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeForeignInterestIncome(
                                        item.id
                                      )
                                    }
                                    className="text-sm font-medium text-rose-600 transition hover:text-rose-700"
                                  >
                                    ลบรายการ
                                  </button>
                                </div>

                                <ForeignIncomeCommonFields
                                  amount={item.amount}
                                  foreignSource={
                                    item.foreignSource!
                                  }
                                  filingTaxYear={
                                    state.taxYear
                                  }
                                  taxability={taxability}
                                  onAmountChange={(value) =>
                                    updateForeignInterestIncome(
                                      item.id,
                                      {
                                        amount: value,
                                      }
                                    )
                                  }
                                  onForeignSourceChange={(
                                    values
                                  ) =>
                                    updateForeignInterestIncome(
                                      item.id,
                                      {
                                        foreignSource: {
                                          ...item.foreignSource!,
                                          ...values,
                                        },
                                      }
                                    )
                                  }
                                />

                                <ForeignTaxCreditReviewFields
                                  foreignSource={
                                    item.foreignSource!
                                  }
                                  taxability={taxability}
                                  onForeignSourceChange={(
                                    values
                                  ) =>
                                    updateForeignInterestIncome(
                                      item.id,
                                      {
                                        foreignSource: {
                                          ...item.foreignSource!,
                                          ...values,
                                        },
                                      }
                                    )
                                  }
                                />
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
              )}

              {showForeignIncomeHub &&
                hasForeignIncomeType(
                  "section40_4Dividend"
                ) && (
                  <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4 sm:p-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <div className="font-semibold text-slate-900">
                          รายได้จากต่างประเทศ 40(4)(ข) - เงินปันผล
                        </div>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          เช่น เงินปันผลหรือส่วนแบ่งกำไร
                          ที่ได้รับจากบริษัทหรือกองทุนในต่างประเทศ
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={
                          addForeignDividendIncome
                        }
                        className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                      >
                        + เพิ่มรายได้ต่างประเทศ
                      </button>
                    </div>

                    {foreignDividendIncomes.length ===
                      0 && (
                      <div className="mt-4 rounded-xl border border-dashed border-emerald-200 bg-white px-4 py-4 text-sm text-slate-400">
                        ยังไม่มีรายได้เงินปันผล 40(4)(ข)
                        จากต่างประเทศ
                      </div>
                    )}

                    {foreignDividendIncomes.length >
                      0 && (
                      <div className="mt-4 space-y-4">
                        {foreignDividendIncomes.map(
                          (item, index) => {
                            const taxability =
                              foreignIncomeAggregate.items.find(
                                (aggregateItem) =>
                                  aggregateItem.section ===
                                    "section40_4Dividend" &&
                                  aggregateItem.id ===
                                    item.id
                              );

                            return (
                              <div
                                key={item.id}
                                className="rounded-2xl border border-emerald-100 bg-white p-4 sm:p-5"
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div className="font-medium text-slate-800">
                                    รายการที่ {index + 1}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeForeignDividendIncome(
                                        item.id
                                      )
                                    }
                                    className="text-sm font-medium text-rose-600 transition hover:text-rose-700"
                                  >
                                    ลบรายการ
                                  </button>
                                </div>

                                <ForeignIncomeCommonFields
                                  amount={item.amount}
                                  foreignSource={
                                    item.foreignSource!
                                  }
                                  filingTaxYear={
                                    state.taxYear
                                  }
                                  taxability={taxability}
                                  onAmountChange={(value) =>
                                    updateForeignDividendIncome(
                                      item.id,
                                      {
                                        amount: value,
                                      }
                                    )
                                  }
                                  onForeignSourceChange={(
                                    values
                                  ) =>
                                    updateForeignDividendIncome(
                                      item.id,
                                      {
                                        foreignSource: {
                                          ...item.foreignSource!,
                                          ...values,
                                        },
                                      }
                                    )
                                  }
                                />

                                <ForeignTaxCreditReviewFields
                                  foreignSource={
                                    item.foreignSource!
                                  }
                                  taxability={taxability}
                                  onForeignSourceChange={(
                                    values
                                  ) =>
                                    updateForeignDividendIncome(
                                      item.id,
                                      {
                                        foreignSource: {
                                          ...item.foreignSource!,
                                          ...values,
                                        },
                                      }
                                    )
                                  }
                                />
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
              )}

              {showForeignIncomeHub &&
                hasForeignIncomeType(
                  "section40_5"
                ) && (
                  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/30 p-4 sm:p-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <div className="font-semibold text-slate-900">
                          รายได้จากต่างประเทศ 40(5) - ค่าเช่า
                        </div>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          เช่น ค่าเช่าบ้าน อาคาร ที่ดิน
                          ยานพาหนะ หรือทรัพย์สินในต่างประเทศ
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={
                          addForeignRentalIncome
                        }
                        className="rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50"
                      >
                        + เพิ่มรายได้ต่างประเทศ
                      </button>
                    </div>

                    {foreignRentalIncomes.length ===
                      0 && (
                      <div className="mt-4 rounded-xl border border-dashed border-amber-200 bg-white px-4 py-4 text-sm text-slate-400">
                        ยังไม่มีรายได้ค่าเช่า 40(5)
                        จากต่างประเทศ
                      </div>
                    )}

                    {foreignRentalIncomes.length >
                      0 && (
                      <div className="mt-4 space-y-4">
                        {foreignRentalIncomes.map(
                          (item, index) => {
                            const taxability =
                              foreignIncomeAggregate.items.find(
                                (aggregateItem) =>
                                  aggregateItem.section ===
                                    "section40_5" &&
                                  aggregateItem.id ===
                                    item.id
                              );
                            
                            const foreignRentalStandardRate =
                              item.assetType
                                ? TAX_RULES_2569
                                    .otherIncomeExpenses
                                    .section40_5Rental
                                    .standardRates[
                                      item.assetType
                                    ]
                                : null;

                            return (
                              <div
                                key={item.id}
                                className="rounded-2xl border border-amber-100 bg-white p-4 sm:p-5"
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div className="font-medium text-slate-800">
                                    รายการที่ {index + 1}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeForeignRentalIncome(
                                        item.id
                                      )
                                    }
                                    className="text-sm font-medium text-rose-600 transition hover:text-rose-700"
                                  >
                                    ลบรายการ
                                  </button>
                                </div>

                                <ForeignIncomeCommonFields
                                  amount={item.amount}
                                  foreignSource={
                                    item.foreignSource!
                                  }
                                  filingTaxYear={
                                    state.taxYear
                                  }
                                  taxability={taxability}
                                  onAmountChange={(value) =>
                                    updateForeignRentalIncome(
                                      item.id,
                                      {
                                        amount: value,
                                      }
                                    )
                                  }
                                  onForeignSourceChange={(
                                    values
                                  ) =>
                                    updateForeignRentalIncome(
                                      item.id,
                                      {
                                        foreignSource: {
                                          ...item.foreignSource!,
                                          ...values,
                                        },
                                      }
                                    )
                                  }
                                />

                                <div className="mt-5">
                                  <label className="mb-2 block text-sm font-medium text-slate-700">
                                    ประเภททรัพย์สินที่ให้เช่า
                                  </label>

                                  <select
                                    value={
                                      item.assetType ?? ""
                                    }
                                    onChange={(e) =>
                                      updateForeignRentalIncome(
                                        item.id,
                                        {
                                          assetType:
                                            (e.target.value ||
                                              null) as Section40_5RentalIncomeData["assetType"],
                                        }
                                      )
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                                  >
                                    <option value="">
                                      เลือกประเภททรัพย์สิน
                                    </option>

                                    <option value="building">
                                      บ้าน / อาคาร / สิ่งปลูกสร้าง
                                    </option>

                                    <option value="agriculturalLand">
                                      ที่ดินที่ใช้ในการเกษตร
                                    </option>

                                    <option value="nonAgriculturalLand">
                                      ที่ดินที่ไม่ได้ใช้ในการเกษตร
                                    </option>

                                    <option value="vehicle">
                                      ยานพาหนะ
                                    </option>

                                    <option value="otherProperty">
                                      ทรัพย์สินอื่น
                                    </option>
                                  </select>
                                </div>

                                <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
                                  <label className="flex cursor-pointer items-start gap-3">
                                    <input
                                      type="checkbox"
                                      checked={
                                        item.isSublease
                                      }
                                      onChange={(e) =>
                                        updateForeignRentalIncome(
                                          item.id,
                                          {
                                            isSublease:
                                              e.target.checked,
                                          }
                                        )
                                      }
                                      className="mt-1 h-4 w-4 rounded border-slate-300"
                                    />

                                    <div>
                                      <div className="font-medium text-slate-800">
                                        เป็นการให้เช่าช่วง
                                      </div>

                                      <div className="mt-1 text-sm leading-5 text-slate-500">
                                        เช่าทรัพย์สินจากผู้อื่นมา
                                        แล้วนำไปให้บุคคลอื่นเช่าต่อ
                                      </div>
                                    </div>
                                  </label>
                                </div>

                                <div className="mt-5">
                                  <div className="mb-2 text-sm font-medium text-slate-700">
                                    วิธีหักค่าใช้จ่าย
                                  </div>

                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateForeignRentalIncome(
                                          item.id,
                                          {
                                            expenseMethod:
                                              "standard",
                                          }
                                        )
                                      }
                                      className={`rounded-xl border px-4 py-3 text-left transition ${
                                        item.expenseMethod ===
                                        "standard"
                                          ? "border-amber-500 bg-amber-50 text-amber-800"
                                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                      }`}
                                    >
                                      <div className="font-medium">
                                        หักค่าใช้จ่ายเหมา
                                      </div>

                                      <div className="mt-1 text-xs leading-5 opacity-75">
                                        {item.isSublease
                                          ? "ใช้ค่าเช่าที่จ่ายให้ผู้ให้เช่ารายเดิมเป็นค่าใช้จ่าย"
                                          : foreignRentalStandardRate !==
                                              null
                                            ? `อัตรา ${(foreignRentalStandardRate * 100).toFixed(0)}%`
                                            : "เลือกประเภททรัพย์สินเพื่อดูอัตรา"}
                                      </div>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateForeignRentalIncome(
                                          item.id,
                                          {
                                            expenseMethod:
                                              "actual",
                                          }
                                        )
                                      }
                                      className={`rounded-xl border px-4 py-3 text-left transition ${
                                        item.expenseMethod ===
                                        "actual"
                                          ? "border-amber-500 bg-amber-50 text-amber-800"
                                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                      }`}
                                    >
                                      <div className="font-medium">
                                        หักค่าใช้จ่ายตามจริง
                                      </div>

                                      <div className="mt-1 text-xs leading-5 opacity-75">
                                        ใช้ค่าใช้จ่ายที่เกี่ยวข้องกับการให้เช่าและมีหลักฐาน
                                      </div>
                                    </button>
                                  </div>
                                </div>

                                {item.isSublease &&
                                  item.expenseMethod ===
                                    "standard" && (
                                    <div className="mt-5">
                                      <MoneyInput
                                        label="ค่าเช่าที่จ่ายให้ผู้ให้เช่ารายเดิม"
                                        description="กรอกค่าเช่าที่จ่ายให้เจ้าของหรือผู้ให้เช่ารายเดิมสำหรับทรัพย์สินที่นำมาให้เช่าช่วง"
                                        value={
                                          item.subleaseRentPaid
                                        }
                                        onChange={(value) =>
                                          updateForeignRentalIncome(
                                            item.id,
                                            {
                                              subleaseRentPaid:
                                                value,
                                            }
                                          )
                                        }
                                      />
                                    </div>
                                )}

                                {item.expenseMethod ===
                                  "actual" && (
                                  <div className="mt-5">
                                    <MoneyInput
                                      label="ค่าใช้จ่ายตามจริง"
                                      description="กรอกเฉพาะค่าใช้จ่ายที่เกี่ยวข้องกับการให้เช่าและมีหลักฐานรองรับ"
                                      value={
                                        item.actualExpense
                                      }
                                      onChange={(value) =>
                                        updateForeignRentalIncome(
                                          item.id,
                                          {
                                            actualExpense:
                                              value,
                                          }
                                        )
                                      }
                                    />
                                  </div>
                                )}

                                {(item.expenseMethod === "actual" ||
                                  item.isSublease) &&
                                  taxability?.isComplete &&
                                  taxability.isTaxable &&
                                  taxability.taxableRemittance >
                                    0 &&
                                  taxability.taxableRemittance <
                                    item.amount && (
                                    <div className="mt-5">
                                      <MoneyInput
                                        label={
                                          item.expenseMethod ===
                                          "actual"
                                            ? "ค่าใช้จ่ายตามจริงที่เกี่ยวกับยอดที่นำเข้าไทย"
                                            : "ค่าเช่าที่จ่ายให้ผู้ให้เช่ารายเดิมที่เกี่ยวกับยอดที่นำเข้าไทย"
                                        }
                                        description="กรอกเฉพาะค่าใช้จ่ายที่เกี่ยวข้องกับส่วนของเงินได้ที่นำเข้าไทย ระบบจะไม่เฉลี่ยค่าใช้จ่ายจากรายได้ทั้งก้อนให้อัตโนมัติ"
                                        value={
                                          item.foreignSource
                                            ?.expenseAttributableToRemittance ??
                                          0
                                        }
                                        onChange={(value) =>
                                          updateForeignRentalIncome(
                                            item.id,
                                            {
                                              foreignSource: {
                                                ...item.foreignSource!,
                                                expenseAttributableToRemittance:
                                                  value,
                                              },
                                            }
                                          )
                                        }
                                      />
                                    </div>
                                )}

                                <ForeignTaxCreditReviewFields
                                  foreignSource={
                                    item.foreignSource!
                                  }
                                  taxability={taxability}
                                  onForeignSourceChange={(
                                    values
                                  ) =>
                                    updateForeignRentalIncome(
                                      item.id,
                                      {
                                        foreignSource: {
                                          ...item.foreignSource!,
                                          ...values,
                                        },
                                      }
                                    )
                                  }
                                />
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
              )}

              {showForeignIncomeHub &&
                hasForeignIncomeType(
                  "section40_6"
                ) && (
                  <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4 sm:p-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <div className="font-semibold text-slate-900">
                          รายได้จากต่างประเทศ 40(6) - วิชาชีพอิสระ
                        </div>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          เช่น การประกอบโรคศิลป
                          ประณีตศิลปกรรม กฎหมาย วิศวกรรม
                          สถาปัตยกรรม หรือการบัญชีในต่างประเทศ
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={
                          addForeignProfessionalIncome
                        }
                        className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                      >
                        + เพิ่มรายได้ต่างประเทศ
                      </button>
                    </div>

                    {foreignProfessionalIncomes.length ===
                      0 && (
                      <div className="mt-4 rounded-xl border border-dashed border-emerald-200 bg-white px-4 py-4 text-sm text-slate-400">
                        ยังไม่มีรายได้วิชาชีพอิสระ 40(6)
                        จากต่างประเทศ
                      </div>
                    )}

                    {foreignProfessionalIncomes.length >
                      0 && (
                      <div className="mt-4 space-y-4">
                        {foreignProfessionalIncomes.map(
                          (item, index) => {
                            const taxability =
                              foreignIncomeAggregate.items.find(
                                (aggregateItem) =>
                                  aggregateItem.section ===
                                    "section40_6" &&
                                  aggregateItem.id ===
                                    item.id
                              );

                            const foreignProfessionalStandardRate =
                              item.professionalType
                                ? TAX_RULES_2569
                                    .otherIncomeExpenses
                                    .section40_6Professional
                                    .standardRates[
                                      item.professionalType
                                    ]
                                : null;

                            return (
                              <div
                                key={item.id}
                                className="rounded-2xl border border-emerald-100 bg-white p-4 sm:p-5"
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div className="font-medium text-slate-800">
                                    รายการที่ {index + 1}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeForeignProfessionalIncome(
                                        item.id
                                      )
                                    }
                                    className="text-sm font-medium text-rose-600 transition hover:text-rose-700"
                                  >
                                    ลบรายการ
                                  </button>
                                </div>

                                <ForeignIncomeCommonFields
                                  amount={item.amount}
                                  foreignSource={
                                    item.foreignSource!
                                  }
                                  filingTaxYear={
                                    state.taxYear
                                  }
                                  taxability={taxability}
                                  onAmountChange={(value) =>
                                    updateForeignProfessionalIncome(
                                      item.id,
                                      {
                                        amount: value,
                                      }
                                    )
                                  }
                                  onForeignSourceChange={(
                                    values
                                  ) =>
                                    updateForeignProfessionalIncome(
                                      item.id,
                                      {
                                        foreignSource: {
                                          ...item.foreignSource!,
                                          ...values,
                                        },
                                      }
                                    )
                                  }
                                />

                                <div className="mt-5">
                                  <label className="mb-2 block text-sm font-medium text-slate-700">
                                    ประเภทวิชาชีพ
                                  </label>

                                  <select
                                    value={
                                      item.professionalType ?? ""
                                    }
                                    onChange={(e) =>
                                      updateForeignProfessionalIncome(
                                        item.id,
                                        {
                                          professionalType:
                                            e.target.value === ""
                                              ? null
                                              : (e.target
                                                  .value as Section40_6ProfessionalIncomeData["professionalType"]),
                                        }
                                      )
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                  >
                                    <option value="">
                                      เลือกประเภทวิชาชีพ
                                    </option>

                                    <option value="medical">
                                      การประกอบโรคศิลป
                                    </option>

                                    <option value="fineArts">
                                      ประณีตศิลปกรรม
                                    </option>

                                    <option value="other">
                                      วิชาชีพอื่น
                                    </option>
                                  </select>

                                  {item.professionalType ===
                                    "other" && (
                                    <p className="mt-2 text-xs leading-5 text-slate-500">
                                      เช่น กฎหมาย วิศวกรรม
                                      สถาปัตยกรรม และการบัญชี
                                    </p>
                                  )}
                                </div>

                                <div className="mt-5">
                                  <div className="mb-2 text-sm font-medium text-slate-700">
                                    วิธีหักค่าใช้จ่าย
                                  </div>

                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateForeignProfessionalIncome(
                                          item.id,
                                          {
                                            expenseMethod:
                                              "standard",
                                          }
                                        )
                                      }
                                      className={`rounded-xl border px-4 py-3 text-left transition ${
                                        item.expenseMethod ===
                                        "standard"
                                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                      }`}
                                    >
                                      <div className="font-medium">
                                        หักค่าใช้จ่ายแบบเหมา
                                      </div>

                                      <div className="mt-1 text-xs leading-5 opacity-75">
                                        {foreignProfessionalStandardRate !==
                                        null
                                          ? `อัตรา ${(
                                              foreignProfessionalStandardRate *
                                              100
                                            ).toFixed(0)}%`
                                          : "เลือกประเภทวิชาชีพเพื่อดูอัตรา"}
                                      </div>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateForeignProfessionalIncome(
                                          item.id,
                                          {
                                            expenseMethod:
                                              "actual",
                                          }
                                        )
                                      }
                                      className={`rounded-xl border px-4 py-3 text-left transition ${
                                        item.expenseMethod ===
                                        "actual"
                                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                      }`}
                                    >
                                      <div className="font-medium">
                                        หักค่าใช้จ่ายตามจริง
                                      </div>

                                      <div className="mt-1 text-xs leading-5 opacity-75">
                                        ใช้ค่าใช้จ่ายที่เกี่ยวข้องกับการประกอบวิชาชีพและมีหลักฐาน
                                      </div>
                                    </button>
                                  </div>
                                </div>

                                {item.expenseMethod ===
                                  "actual" && (
                                  <div className="mt-5">
                                    <MoneyInput
                                      label="ค่าใช้จ่ายตามจริง"
                                      description="กรอกค่าใช้จ่ายที่เกี่ยวข้องกับการประกอบวิชาชีพและมีหลักฐานรองรับ"
                                      value={
                                        item.actualExpense
                                      }
                                      onChange={(value) =>
                                        updateForeignProfessionalIncome(
                                          item.id,
                                          {
                                            actualExpense:
                                              value,
                                          }
                                        )
                                      }
                                    />
                                  </div>
                                )}

                                {item.expenseMethod ===
                                  "actual" &&
                                  taxability?.isComplete &&
                                  taxability.isTaxable &&
                                  taxability.taxableRemittance > 0 &&
                                  taxability.taxableRemittance <
                                    item.amount && (
                                    <div className="mt-5">
                                      <MoneyInput
                                        label="ค่าใช้จ่ายตามจริงที่เกี่ยวกับยอดที่นำเข้าไทย"
                                        description="กรอกเฉพาะค่าใช้จ่ายที่เกี่ยวข้องกับส่วนของเงินได้ที่นำเข้าไทย ระบบจะไม่เฉลี่ยค่าใช้จ่ายจากรายได้ทั้งก้อนให้อัตโนมัติ"
                                        value={
                                          item.foreignSource
                                            ?.expenseAttributableToRemittance ??
                                          0
                                        }
                                        onChange={(value) =>
                                          updateForeignProfessionalIncome(
                                            item.id,
                                            {
                                              foreignSource: {
                                                ...item.foreignSource!,
                                                expenseAttributableToRemittance:
                                                  value,
                                              },
                                            }
                                          )
                                        }
                                      />
                                    </div>
                                )}

                                <ForeignTaxCreditReviewFields
                                  foreignSource={
                                    item.foreignSource!
                                  }
                                  taxability={taxability}
                                  onForeignSourceChange={(
                                    values
                                  ) =>
                                    updateForeignProfessionalIncome(
                                      item.id,
                                      {
                                        foreignSource: {
                                          ...item.foreignSource!,
                                          ...values,
                                        },
                                      }
                                    )
                                  }
                                />
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
              )}

              {showForeignIncomeHub &&
                hasForeignIncomeType(
                  "section40_7"
                ) && (
                  <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50/30 p-4 sm:p-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <div className="font-semibold text-slate-900">
                          รายได้จากต่างประเทศ 40(7) - รับเหมา
                        </div>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          งานรับเหมาจากต่างประเทศ
                          ที่ผู้รับเหมาต้องลงทุนจัดหาสัมภาระในส่วนสำคัญ
                          นอกจากเครื่องมือ
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={
                          addForeignContractIncome
                        }
                        className="rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-50"
                      >
                        + เพิ่มรายได้ต่างประเทศ
                      </button>
                    </div>

                    {foreignContractIncomes.length ===
                      0 && (
                      <div className="mt-4 rounded-xl border border-dashed border-sky-200 bg-white px-4 py-4 text-sm text-slate-400">
                        ยังไม่มีรายได้จากการรับเหมา 40(7)
                        จากต่างประเทศ
                      </div>
                    )}

                    {foreignContractIncomes.length >
                      0 && (
                      <div className="mt-4 space-y-4">
                        {foreignContractIncomes.map(
                          (item, index) => {
                            const taxability =
                              foreignIncomeAggregate.items.find(
                                (aggregateItem) =>
                                  aggregateItem.section ===
                                    "section40_7" &&
                                  aggregateItem.id ===
                                    item.id
                              );

                            return (
                              <div
                                key={item.id}
                                className="rounded-2xl border border-sky-100 bg-white p-4 sm:p-5"
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div className="font-medium text-slate-800">
                                    รายการที่ {index + 1}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeForeignContractIncome(
                                        item.id
                                      )
                                    }
                                    className="text-sm font-medium text-rose-600 transition hover:text-rose-700"
                                  >
                                    ลบรายการ
                                  </button>
                                </div>

                                <ForeignIncomeCommonFields
                                  amount={item.amount}
                                  foreignSource={
                                    item.foreignSource!
                                  }
                                  filingTaxYear={
                                    state.taxYear
                                  }
                                  taxability={taxability}
                                  onAmountChange={(value) =>
                                    updateForeignContractIncome(
                                      item.id,
                                      {
                                        amount: value,
                                      }
                                    )
                                  }
                                  onForeignSourceChange={(
                                    values
                                  ) =>
                                    updateForeignContractIncome(
                                      item.id,
                                      {
                                        foreignSource: {
                                          ...item.foreignSource!,
                                          ...values,
                                        },
                                      }
                                    )
                                  }
                                />

                                <div className="mt-5">
                                  <div className="mb-2 text-sm font-medium text-slate-700">
                                    วิธีหักค่าใช้จ่าย
                                  </div>

                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateForeignContractIncome(
                                          item.id,
                                          {
                                            expenseMethod:
                                              "standard",
                                          }
                                        )
                                      }
                                      className={`rounded-xl border px-4 py-3 text-left transition ${
                                        item.expenseMethod ===
                                        "standard"
                                          ? "border-sky-500 bg-sky-50 text-sky-800"
                                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                      }`}
                                    >
                                      <div className="font-medium">
                                        หักค่าใช้จ่ายแบบเหมา
                                      </div>

                                      <div className="mt-1 text-xs leading-5 opacity-75">
                                        อัตรา{" "}
                                        {(
                                          contractStandardRate *
                                          100
                                        ).toFixed(0)}
                                        %
                                      </div>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateForeignContractIncome(
                                          item.id,
                                          {
                                            expenseMethod:
                                              "actual",
                                          }
                                        )
                                      }
                                      className={`rounded-xl border px-4 py-3 text-left transition ${
                                        item.expenseMethod ===
                                        "actual"
                                          ? "border-sky-500 bg-sky-50 text-sky-800"
                                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                      }`}
                                    >
                                      <div className="font-medium">
                                        หักค่าใช้จ่ายตามจริง
                                      </div>

                                      <div className="mt-1 text-xs leading-5 opacity-75">
                                        ใช้ค่าใช้จ่ายที่เกี่ยวข้องกับการรับเหมาและมีหลักฐาน
                                      </div>
                                    </button>
                                  </div>
                                </div>

                                {item.expenseMethod ===
                                  "actual" && (
                                  <div className="mt-5">
                                    <MoneyInput
                                      label="ค่าใช้จ่ายตามจริง"
                                      description="กรอกค่าใช้จ่ายที่เกี่ยวข้องกับการรับเหมาและมีหลักฐานรองรับ"
                                      value={
                                        item.actualExpense
                                      }
                                      onChange={(value) =>
                                        updateForeignContractIncome(
                                          item.id,
                                          {
                                            actualExpense:
                                              value,
                                          }
                                        )
                                      }
                                    />
                                  </div>
                                )}

                                {item.expenseMethod ===
                                  "actual" &&
                                  taxability?.isComplete &&
                                  taxability.isTaxable &&
                                  taxability.taxableRemittance > 0 &&
                                  taxability.taxableRemittance <
                                    item.amount && (
                                    <div className="mt-5">
                                      <MoneyInput
                                        label="ค่าใช้จ่ายตามจริงที่เกี่ยวกับยอดที่นำเข้าไทย"
                                        description="กรอกเฉพาะค่าใช้จ่ายที่เกี่ยวข้องกับส่วนของเงินได้ที่นำเข้าไทย ระบบจะไม่เฉลี่ยค่าใช้จ่ายจากรายได้ทั้งก้อนให้อัตโนมัติ"
                                        value={
                                          item.foreignSource
                                            ?.expenseAttributableToRemittance ??
                                          0
                                        }
                                        onChange={(value) =>
                                          updateForeignContractIncome(
                                            item.id,
                                            {
                                              foreignSource: {
                                                ...item.foreignSource!,
                                                expenseAttributableToRemittance:
                                                  value,
                                              },
                                            }
                                          )
                                        }
                                      />
                                    </div>
                                )}

                                <ForeignTaxCreditReviewFields
                                  foreignSource={
                                    item.foreignSource!
                                  }
                                  taxability={taxability}
                                  onForeignSourceChange={(
                                    values
                                  ) =>
                                    updateForeignContractIncome(
                                      item.id,
                                      {
                                        foreignSource: {
                                          ...item.foreignSource!,
                                          ...values,
                                        },
                                      }
                                    )
                                  }
                                />
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
              )}

              {showForeignIncomeHub &&
                hasForeignIncomeType(
                  "section40_8"
                ) && (
                  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/30 p-4 sm:p-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <div className="font-semibold text-slate-900">
                          รายได้จากต่างประเทศ 40(8) - ธุรกิจ / กิจการอื่น
                        </div>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          รายได้จากธุรกิจ การค้า
                          การเกษตร การขนส่ง
                          หรือกิจการอื่นจากต่างประเทศ
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={
                          addForeignBusinessIncome
                        }
                        className="rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50"
                      >
                        + เพิ่มรายได้ต่างประเทศ
                      </button>
                    </div>

                    {foreignBusinessIncomes.length ===
                      0 && (
                      <div className="mt-4 rounded-xl border border-dashed border-amber-200 bg-white px-4 py-4 text-sm text-slate-400">
                        ยังไม่มีรายได้ธุรกิจ / กิจการอื่น 40(8)
                        จากต่างประเทศ
                      </div>
                    )}

                    {foreignBusinessIncomes.length >
                      0 && (
                      <div className="mt-4 space-y-4">
                        {foreignBusinessIncomes.map(
                          (item, index) => {
                            const taxability =
                              foreignIncomeAggregate.items.find(
                                (aggregateItem) =>
                                  aggregateItem.section ===
                                    "section40_8" &&
                                  aggregateItem.id ===
                                    item.id
                              );

                            return (
                              <div
                                key={item.id}
                                className="rounded-2xl border border-amber-100 bg-white p-4 sm:p-5"
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div className="font-medium text-slate-800">
                                    รายการที่ {index + 1}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeForeignBusinessIncome(
                                        item.id
                                      )
                                    }
                                    className="text-sm font-medium text-rose-600 transition hover:text-rose-700"
                                  >
                                    ลบรายการ
                                  </button>
                                </div>

                                <ForeignIncomeCommonFields
                                  amount={item.amount}
                                  foreignSource={
                                    item.foreignSource!
                                  }
                                  filingTaxYear={
                                    state.taxYear
                                  }
                                  taxability={taxability}
                                  onAmountChange={(value) =>
                                    updateForeignBusinessIncome(
                                      item.id,
                                      {
                                        amount: value,
                                      }
                                    )
                                  }
                                  onForeignSourceChange={(
                                    values
                                  ) =>
                                    updateForeignBusinessIncome(
                                      item.id,
                                      {
                                        foreignSource: {
                                          ...item.foreignSource!,
                                          ...values,
                                        },
                                      }
                                    )
                                  }
                                />

                                <div className="mt-5">
                                  <label className="mb-2 block text-sm font-medium text-slate-700">
                                    กลุ่มกิจการ
                                  </label>

                                  <select
                                    value={
                                      item.category ?? ""
                                    }
                                    onChange={(e) => {
                                      const category =
                                        e.target.value === ""
                                          ? null
                                          : (e.target
                                              .value as Section40_8BusinessIncomeData["category"]);

                                      updateForeignBusinessIncome(
                                        item.id,
                                        {
                                          category,

                                          ...(category ===
                                          "actualOnly"
                                            ? {
                                                expenseMethod:
                                                  "actual" as const,
                                              }
                                            : {}),
                                        }
                                      );
                                    }}
                                    className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                  >
                                    <option value="">
                                      เลือกกลุ่มกิจการ
                                    </option>

                                    <option value="standard60">
                                      กิจการที่หักค่าใช้จ่ายเหมา 60% ได้
                                    </option>

                                    <option value="performer">
                                      นักแสดง / งานบันเทิง / นักกีฬาอาชีพ
                                    </option>

                                    <option value="actualOnly">
                                      กิจการที่หักค่าใช้จ่ายตามจริงเท่านั้น
                                    </option>
                                  </select>

                                  {taxability?.isComplete &&
                                    taxability.isTaxable &&
                                    taxability.taxableRemittance >
                                      0 &&
                                    item.category === null && (
                                      <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                                        กรุณาเลือกกลุ่มกิจการ
                                        เพื่อให้ระบบคำนวณค่าใช้จ่ายของรายได้ 40(8)
                                        ได้ครบถ้วน
                                      </div>
                                  )}

                                  {taxability?.isComplete &&
                                    taxability.isTaxable &&
                                    taxability.taxableRemittance >
                                      0 &&
                                    item.category &&
                                    conflictingBusinessActivityKeys.has(
                                      `${item.category}:${
                                        item.activityCode?.trim() ||
                                        "__unspecified__"
                                      }`
                                    ) && (
                                      <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                                        กิจการประเภทเดียวกันกำลังใช้วิธีหักค่าใช้จ่ายต่างกัน
                                        กรุณาเลือกวิธีหักค่าใช้จ่ายให้เหมือนกัน
                                      </div>
                                  )}
                                </div>

                                <div className="mt-5">
                                  <label className="mb-2 block text-sm font-medium text-slate-700">
                                    ประเภท / ลักษณะกิจการ
                                  </label>

                                  <input
                                    type="text"
                                    value={
                                      item.activityCode ?? ""
                                    }
                                    onChange={(e) =>
                                      updateForeignBusinessIncome(
                                        item.id,
                                        {
                                          activityCode:
                                            e.target.value,
                                        }
                                      )
                                    }
                                    onBlur={(e) =>
                                      updateForeignBusinessIncome(
                                        item.id,
                                        {
                                          activityCode:
                                            e.target.value.trim() ||
                                            null,
                                        }
                                      )
                                    }
                                    placeholder="เช่น ร้านอาหาร, ขายสินค้าออนไลน์, งานแสดง"
                                    className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                  />

                                  <p className="mt-2 text-xs leading-5 text-slate-500">
                                    หากมีหลายรายการจากกิจการประเภทเดียวกัน
                                    ให้ใช้ชื่อเดียวกัน
                                    เพื่อให้ระบบตรวจสอบวิธีหักค่าใช้จ่ายได้ถูกต้อง
                                  </p>
                                </div>

                                {item.category ===
                                  "performer" && (
                                  <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                                    กรณีผู้แสดง:
                                    เงินได้{" "}
                                    {formatNumber(
                                      performerFirstTierLimit
                                    )}{" "}
                                    บาทแรก หักค่าใช้จ่ายเหมา{" "}
                                    {(
                                      performerFirstTierRate *
                                      100
                                    ).toFixed(0)}
                                    % ส่วนที่เกินหัก{" "}
                                    {(
                                      performerExcessRate *
                                      100
                                    ).toFixed(0)}
                                    % และค่าใช้จ่ายเหมารวมไม่เกิน{" "}
                                    {formatNumber(
                                      performerMaxExpense
                                    )}{" "}
                                    บาท
                                  </div>
                                )}

                                {item.category ===
                                  "actualOnly" && (
                                  <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                                    กิจการกลุ่มนี้ไม่ใช้ค่าใช้จ่ายแบบเหมา
                                    ระบบจะใช้ค่าใช้จ่ายตามจริง
                                  </div>
                                )}

                                {item.category &&
                                  item.category !==
                                    "actualOnly" && (
                                  <div className="mt-5">
                                    <div className="text-sm font-medium text-slate-700">
                                      วิธีหักค่าใช้จ่าย
                                    </div>

                                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateForeignBusinessIncome(
                                            item.id,
                                            {
                                              expenseMethod:
                                                "standard",
                                            }
                                          )
                                        }
                                        className={`rounded-xl border px-4 py-3 text-left transition ${
                                          item.expenseMethod ===
                                          "standard"
                                            ? "border-amber-500 bg-amber-50 text-amber-800"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                        }`}
                                      >
                                        <div className="font-medium">
                                          หักค่าใช้จ่ายแบบเหมา
                                        </div>

                                        <div className="mt-1 text-xs leading-5 opacity-75">
                                          {item.category ===
                                          "standard60"
                                            ? `อัตรา ${(
                                                businessStandardRate *
                                                100
                                              ).toFixed(0)}%`
                                            : "ใช้อัตราสำหรับผู้แสดง"}
                                        </div>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateForeignBusinessIncome(
                                            item.id,
                                            {
                                              expenseMethod:
                                                "actual",
                                            }
                                          )
                                        }
                                        className={`rounded-xl border px-4 py-3 text-left transition ${
                                          item.expenseMethod ===
                                          "actual"
                                            ? "border-amber-500 bg-amber-50 text-amber-800"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                        }`}
                                      >
                                        <div className="font-medium">
                                          หักค่าใช้จ่ายตามจริง
                                        </div>

                                        <div className="mt-1 text-xs leading-5 opacity-75">
                                          ใช้ค่าใช้จ่ายที่เกี่ยวข้องกับกิจการและมีหลักฐาน
                                        </div>
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {item.category ===
                                  "actualOnly" && (
                                  <div className="mt-5">
                                    <div className="text-sm font-medium text-slate-700">
                                      วิธีหักค่าใช้จ่าย
                                    </div>

                                    <div className="mt-3 rounded-xl border border-amber-500 bg-amber-50 px-4 py-3 text-amber-800">
                                      <div className="font-medium">
                                        หักค่าใช้จ่ายตามจริง
                                      </div>

                                      <div className="mt-1 text-xs leading-5 opacity-75">
                                        กิจการประเภทนี้ไม่สามารถเลือกหักค่าใช้จ่ายแบบเหมา
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {item.expenseMethod ===
                                  "actual" &&
                                  item.category && (
                                  <div className="mt-5">
                                    <MoneyInput
                                      label="ค่าใช้จ่ายตามจริง"
                                      description="กรอกเฉพาะค่าใช้จ่ายที่เกี่ยวข้องกับกิจการ"
                                      value={
                                        item.actualExpense
                                      }
                                      onChange={(value) =>
                                        updateForeignBusinessIncome(
                                          item.id,
                                          {
                                            actualExpense:
                                              value,
                                          }
                                        )
                                      }
                                    />
                                  </div>
                                )}

                                {item.expenseMethod ===
                                  "actual" &&
                                  item.category &&
                                  taxability?.isComplete &&
                                  taxability.isTaxable &&
                                  taxability.taxableRemittance > 0 &&
                                  taxability.taxableRemittance <
                                    item.amount && (
                                    <div className="mt-5">
                                      <MoneyInput
                                        label="ค่าใช้จ่ายตามจริงที่เกี่ยวกับยอดที่นำเข้าไทย"
                                        description="กรอกเฉพาะค่าใช้จ่ายที่เกี่ยวข้องกับส่วนของเงินได้ที่นำเข้าไทย ระบบจะไม่เฉลี่ยค่าใช้จ่ายจากรายได้ทั้งก้อนให้อัตโนมัติ"
                                        value={
                                          item.foreignSource
                                            ?.expenseAttributableToRemittance ??
                                          0
                                        }
                                        onChange={(value) =>
                                          updateForeignBusinessIncome(
                                            item.id,
                                            {
                                              foreignSource: {
                                                ...item.foreignSource!,
                                                expenseAttributableToRemittance:
                                                  value,
                                              },
                                            }
                                          )
                                        }
                                      />
                                    </div>
                                )}

                                <ForeignTaxCreditReviewFields
                                  foreignSource={
                                    item.foreignSource!
                                  }
                                  taxability={taxability}
                                  onForeignSourceChange={(
                                    values
                                  ) =>
                                    updateForeignBusinessIncome(
                                      item.id,
                                      {
                                        foreignSource: {
                                          ...item.foreignSource!,
                                          ...values,
                                        },
                                      }
                                    )
                                  }
                                />
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
              )}

              {income.hasOtherIncome && (
                <div className="mt-6 space-y-4">

                  {income.otherIncome.investment > 0 && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                      พบรายได้จากการลงทุนจากข้อมูลเวอร์ชันเดิมจำนวน{" "}
                      <strong>
                        {formatNumber(
                          income.otherIncome.investment
                        )}{" "}
                        บาท
                      </strong>
                      {" "}ระบบจะไม่นำยอดนี้มาคำนวณอัตโนมัติ
                      กรุณากรอกใหม่ในหมวดรายได้ที่ถูกต้องด้านล่าง
                    </div>
                  )}

                  {legacyRentIncome > 0 && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                      พบรายได้ค่าเช่าจากข้อมูลเวอร์ชันเดิมจำนวน{" "}
                      <strong>
                        {formatNumber(
                          legacyRentIncome
                        )}{" "}
                        บาท
                      </strong>
                      {" "}
                      ยอดเดิมนี้ยังถูกรวมอยู่ในรายได้
                      หากต้องการกรอกใหม่ในหมวด 40(5)
                      ให้ล้างยอดเดิมก่อน

                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            setOtherIncome(
                              "rent",
                              0
                            )
                          }
                          className="mt-3 rounded-lg border border-amber-300 bg-white px-4 py-2 font-medium text-amber-800 transition hover:bg-amber-100"
                        >
                          ล้างยอดค่าเช่าเดิมและกรอกใหม่
                        </button>
                      </div>
                    </div>
                  )}

                  {legacyProfessionalIncome > 0 && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                      พบรายได้วิชาชีพอิสระจากข้อมูลเวอร์ชันเดิมจำนวน{" "}
                      <strong>
                        {formatNumber(
                          legacyProfessionalIncome
                        )}{" "}
                        บาท
                      </strong>{" "}
                      ยอดเดิมนี้ยังถูกรวมอยู่ในรายได้
                      แต่ระบบยังไม่ทราบประเภทวิชาชีพและวิธีหักค่าใช้จ่าย
                      หากต้องการกรอกใหม่ในหมวด 40(6)
                      ให้ล้างยอดเดิมก่อน

                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            setOtherIncome(
                              "professional",
                              0
                            )
                          }
                          className="mt-3 rounded-lg border border-amber-300 bg-white px-4 py-2 font-medium text-amber-800 transition hover:bg-amber-100"
                        >
                          ล้างยอดวิชาชีพอิสระเดิมและกรอกใหม่
                        </button>
                      </div>
                    </div>
                  )}

                  {legacyBusinessIncome > 0 && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                      พบรายได้ธุรกิจ / ค้าขายจากข้อมูลเวอร์ชันเดิมจำนวน{" "}
                      <strong>
                        {formatNumber(
                          legacyBusinessIncome
                        )}{" "}
                        บาท
                      </strong>{" "}
                      ยอดเดิมนี้ยังถูกรวมอยู่ในรายได้
                      แต่ระบบยังไม่ทราบประเภทกิจการและวิธีหักค่าใช้จ่าย
                      หากต้องการกรอกใหม่ในหมวด 40(8)
                      ให้ล้างยอดเดิมก่อน

                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            setOtherIncome(
                              "business",
                              0
                            )
                          }
                          className="mt-3 rounded-lg border border-amber-300 bg-white px-4 py-2 font-medium text-amber-800 transition hover:bg-amber-100"
                        >
                          ล้างยอดธุรกิจเดิมและกรอกใหม่
                        </button>
                      </div>
                    </div>
                  )}

                  {otherIncomeDefinitions
                    .filter(
                      (item) =>
                        item.id !== "rent" &&
                        item.id !== "professional" &&
                        item.id !== "business"
                    )
                    .map(
                      (item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-slate-200 p-4 sm:p-5"
                      >
                        <div className="grid gap-4 md:grid-cols-[1fr_220px] md:items-center">

                          <div>
                            <div className="font-medium text-slate-800">
                              {
                                item.label
                              }
                            </div>

                            <div className="mt-1 text-sm text-slate-400">
                              {
                                item.description
                              }
                            </div>
                          </div>

                          <div className="relative">
                            <input
                              inputMode="numeric"
                              value={
                                income
                                  .otherIncome[
                                  item.id
                                ]
                                  ? formatNumber(
                                      income
                                        .otherIncome[
                                        item
                                          .id
                                      ]
                                    )
                                  : ""
                              }
                              onChange={(
                                e
                              ) =>
                                setOtherIncome(
                                  item.id,
                                  parseNumber(
                                    e
                                      .target
                                      .value
                                  )
                                )
                              }
                              placeholder="0"
                              className="h-12 w-full rounded-xl border border-slate-300 px-4 pr-16 text-right text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />

                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                              บาท
                            </span>
                          </div>
                        </div>

                        {item.id === "commission" && (
                          <div className="mt-4 border-t border-slate-100 pt-4">
                            <MoneyInput
                              label="ภาษีหัก ณ ที่จ่ายจากเงินได้ 40(2)"
                              description="กรอกยอดภาษีที่ถูกหักจริงตามหนังสือรับรองหรือข้อมูลจากผู้จ่ายเงิน"
                              value={
                                income.section40_2TaxWithheld ?? 0
                              }
                              onChange={(value) =>
                                setIncome({
                                  section40_2TaxWithheld:
                                    value,
                                })
                              }
                            />
                          </div>
                        )}
                      </div>
                    )
                  )}

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5">
                        <div>
                          <div className="font-semibold text-slate-900">
                            ค่าลิขสิทธิ์ / ค่าสิทธิ 40(3)
                          </div>

                          <div className="mt-1 text-sm leading-6 text-slate-500">
                            เงินได้จากค่าลิขสิทธิ์ ค่าสิทธิ
                            หรือสิทธิอย่างอื่น
                          </div>
                        </div>                  

                        <div className="mt-5 grid gap-5 md:grid-cols-2">
                          <MoneyInput
                            label="รายได้ทั้งปี"
                            value={
                              rightsIncome?.amount ?? 0
                            }
                            onChange={(value) =>
                              updateRightsIncome({
                                amount: value,
                              })
                            }
                          />

                          <MoneyInput
                            label="ภาษีหัก ณ ที่จ่าย"
                            description="กรอกยอดที่ถูกหักจริงตามหนังสือรับรอง"
                            value={
                              rightsIncome?.taxWithheld ?? 0
                            }
                            onChange={(value) =>
                              updateRightsIncome({
                                taxWithheld: value,
                              })
                            }
                          />
                        </div>

                        <div className="mt-5">
                          <div className="text-sm font-medium text-slate-700">
                            วิธีหักค่าใช้จ่าย
                          </div>

                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <button
                              type="button"
                              onClick={() =>
                                updateRightsIncome({
                                  expenseMethod: "standard",
                                })
                              }
                              className={`rounded-xl border px-4 py-3 text-left transition ${
                                (rightsIncome?.expenseMethod ?? "standard") ===
                                "standard"
                                  ? "border-blue-500 bg-blue-50 text-blue-800"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              <div className="font-medium">
                                หักค่าใช้จ่ายแบบเหมา
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                updateRightsIncome({
                                  expenseMethod: "actual",
                                })
                              }
                              className={`rounded-xl border px-4 py-3 text-left transition ${
                                rightsIncome?.expenseMethod === "actual"
                                  ? "border-blue-500 bg-blue-50 text-blue-800"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              <div className="font-medium">
                                หักค่าใช้จ่ายตามจริง
                              </div>
                            </button>
                          </div>
                        </div>

                        {rightsIncome?.expenseMethod === "actual" && (
                          <div className="mt-5">
                            <MoneyInput
                              label="ค่าใช้จ่ายตามจริง"
                              value={rightsIncome.actualExpense}
                              onChange={(value) =>
                                updateRightsIncome({
                                  actualExpense: value,
                                })
                              }
                            />
                          </div>
                        )}

                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5">
                        <div>
                          <div className="font-semibold text-slate-900">
                            เงินได้ประเภท Annuity 40(3)
                          </div>

                          <div className="mt-1 text-sm leading-6 text-slate-500">
                            เงินได้ที่มีลักษณะเป็นเงินรายปีตามมาตรา 40(3)
                          </div>
                        </div>

                        <div className="mt-5 grid gap-5 md:grid-cols-2">
                          <MoneyInput
                            label="รายได้ทั้งปี"
                            value={
                              annuityIncome?.amount ?? 0
                            }
                            onChange={(value) =>
                              updateAnnuityIncome({
                                amount: value,
                              })
                            }
                          />

                          <MoneyInput
                            label="ภาษีหัก ณ ที่จ่าย"
                            description="กรอกยอดที่ถูกหักจริงตามหนังสือรับรอง"
                            value={
                              annuityIncome?.taxWithheld ?? 0
                            }
                            onChange={(value) =>
                              updateAnnuityIncome({
                                taxWithheld: value,
                              })
                            }
                          />
                        </div>

                      </div>

                      <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 sm:p-5">
                        <div>
                          <div className="font-semibold text-slate-900">
                            ดอกเบี้ย 40(4)(ก)
                          </div>

                          <div className="mt-1 text-sm leading-6 text-slate-500">
                            เช่น ดอกเบี้ยเงินฝาก
                            หรือดอกเบี้ยที่ถูกหักภาษี ณ ที่จ่าย
                          </div>
                        </div>

                        <div className="mt-5">
                          <div className="text-sm font-medium text-slate-700">
                            เลือกวิธีเสียภาษี
                          </div>

                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <button
                              type="button"
                              onClick={() =>
                                selectInterestTaxTreatment(
                                  "final"
                                )
                              }
                              className={`rounded-xl border px-4 py-3 text-left transition ${
                                interestIncome?.taxTreatment ===
                                "final"
                                  ? "border-blue-500 bg-blue-50 text-blue-800"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              <div className="font-medium">
                                Final Tax
                              </div>

                              <div className="mt-1 text-xs leading-5 opacity-75">
                                ไม่นำดอกเบี้ยรายการนี้มารวมคำนวณภาษีปลายปี
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                selectInterestTaxTreatment(
                                  "include"
                                )
                              }
                              className={`rounded-xl border px-4 py-3 text-left transition ${
                                interestIncome?.taxTreatment ===
                                "include"
                                  ? "border-blue-500 bg-blue-50 text-blue-800"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              <div className="font-medium">
                                นำมารวมคำนวณ
                              </div>

                              <div className="mt-1 text-xs leading-5 opacity-75">
                                นำดอกเบี้ยมารวมคำนวณภาษีประจำปี
                              </div>
                            </button>
                          </div>
                        </div>

                        {interestIncome && (
                          <div className="mt-5 grid gap-5 md:grid-cols-2">
                            <MoneyInput
                              label="ดอกเบี้ยที่ได้รับทั้งปี"
                              value={
                                interestIncome.amount
                              }
                              onChange={(value) =>
                                updateInterestIncome({
                                  amount: value,
                                })
                              }
                            />

                            <div>
                              <MoneyInput
                                label="ภาษีหัก ณ ที่จ่ายจากดอกเบี้ย"
                                value={
                                  interestIncome.taxWithheld
                                }
                                onChange={(value) =>
                                  updateInterestIncome({
                                    taxWithheld: value,
                                  })
                                }
                              />

                              <p className="mt-2 text-sm leading-5 text-slate-400">
                                กรอกตามหนังสือรับรองหรือข้อมูลจากผู้จ่ายเงิน
                              </p>
                            </div>
                          </div>
                        )}

                        {!interestIncome && (
                          <div className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-slate-500">
                            กรุณาเลือกวิธีเสียภาษีก่อนกรอกยอดดอกเบี้ย
                          </div>
                        )}
                      </div>
                        <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4 sm:p-5">
                          <div>
                            <div className="font-semibold text-slate-900">
                              เงินปันผล 40(4)(ข)
                            </div>

                            <div className="mt-1 text-sm leading-6 text-slate-500">
                              เงินปันผลจากบริษัทหรือห้างหุ้นส่วนนิติบุคคล
                              ที่มีการหักภาษี ณ ที่จ่าย
                            </div>
                          </div>

                          <div className="mt-5">
                            <div className="text-sm font-medium text-slate-700">
                              เลือกวิธีเสียภาษี
                            </div>

                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <button
                                type="button"
                                onClick={() =>
                                  selectDividendTaxTreatment(
                                    "final"
                                  )
                                }
                                className={`rounded-xl border px-4 py-3 text-left transition ${
                                  dividendIncome?.taxTreatment ===
                                  "final"
                                    ? "border-violet-500 bg-violet-50 text-violet-800"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                }`}
                              >
                                <div className="font-medium">
                                  Final Tax
                                </div>

                                <div className="mt-1 text-xs leading-5 opacity-75">
                                  ไม่นำเงินปันผลรายการนี้มารวมคำนวณภาษีปลายปี
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  selectDividendTaxTreatment(
                                    "include"
                                  )
                                }
                                className={`rounded-xl border px-4 py-3 text-left transition ${
                                  dividendIncome?.taxTreatment ===
                                  "include"
                                    ? "border-violet-500 bg-violet-50 text-violet-800"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                }`}
                              >
                                <div className="font-medium">
                                  นำมารวมคำนวณ
                                </div>

                                <div className="mt-1 text-xs leading-5 opacity-75">
                                  นำเงินปันผลและเครดิตภาษีเงินปันผล
                                  มารวมคำนวณภาษีประจำปี
                                </div>
                              </button>
                            </div>
                          </div>

                          {dividendIncome && (
                            <div className="mt-5 grid gap-5 md:grid-cols-2">
                              <MoneyInput
                                label="เงินปันผลที่ได้รับทั้งปี"
                                value={
                                  dividendIncome.amount
                                }
                                onChange={(value) =>
                                  updateDividendIncome({
                                    amount: value,
                                  })
                                }
                              />

                              <div>
                                <MoneyInput
                                  label="ภาษีหัก ณ ที่จ่ายจากเงินปันผล"
                                  value={
                                    dividendIncome.taxWithheld
                                  }
                                  onChange={(value) =>
                                    updateDividendIncome({
                                      taxWithheld: value,
                                    })
                                  }
                                />

                                <p className="mt-2 text-sm leading-5 text-slate-400">
                                  กรอกยอดภาษีที่ถูกหักจากเงินปันผลตามหนังสือรับรอง
                                </p>
                              </div>

                              {dividendIncome.taxTreatment ===
                                "include" && (
                                <div>
                                  <MoneyInput
                                    label="เครดิตภาษีเงินปันผล (ถ้ามี)"
                                    value={
                                      dividendIncome.dividendTaxCredit
                                    }
                                    onChange={(value) =>
                                      updateDividendIncome({
                                        dividendTaxCredit:
                                          value,
                                      })
                                    }
                                  />

                                  <p className="mt-2 text-sm leading-5 text-slate-400">
                                    กรอกตามหนังสือรับรอง หากไม่มีเครดิตภาษีเงินปันผลให้เว้นไว้
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {!dividendIncome && (
                            <div className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-slate-500">
                              กรุณาเลือกวิธีเสียภาษีก่อนกรอกยอดเงินปันผล
                            </div>
                          )}
                        </div>

                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5">
                          <div>
                            <div className="font-semibold text-slate-900">
                              รายได้ค่าเช่า 40(5)
                            </div>

                            <div className="mt-1 text-sm leading-6 text-slate-500">
                              รายได้จากการให้เช่าทรัพย์สิน
                              กรุณาระบุประเภททรัพย์สินเพื่อใช้คำนวณค่าใช้จ่าย
                            </div>
                          </div>

                          <div className="mt-5 grid gap-5 md:grid-cols-2">
                            <MoneyInput
                              label="รายได้ค่าเช่าทั้งปี"
                              value={
                                rentalIncome?.amount ?? 0
                              }
                              onChange={(value) =>
                                updateRentalIncome({
                                  amount: value,
                                })
                              }
                            />

                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                ประเภททรัพย์สิน
                              </label>

                              <select
                                value={
                                  rentalIncome?.assetType ?? ""
                                }
                                onChange={(e) =>
                                  updateRentalIncome({
                                    assetType:
                                      e.target.value === ""
                                        ? null
                                        : (e.target
                                            .value as Section40_5RentalIncomeData["assetType"]),
                                  })
                                }
                                className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                              >
                                <option value="">
                                  เลือกประเภททรัพย์สิน
                                </option>

                                <option value="building">
                                  อาคาร / สิ่งปลูกสร้าง / แพ
                                </option>

                                <option value="agriculturalLand">
                                  ที่ดินที่ใช้ในการเกษตร
                                </option>

                                <option value="nonAgriculturalLand">
                                  ที่ดินที่ไม่ได้ใช้ในการเกษตร
                                </option>

                                <option value="vehicle">
                                  ยานพาหนะ
                                </option>

                                <option value="otherProperty">
                                  ทรัพย์สินอื่น
                                </option>
                              </select>
                            </div>
                          </div>

                          <div className="mt-5">
                            <MoneyInput
                              label="ภาษีหัก ณ ที่จ่ายจากค่าเช่า"
                              description="กรอกยอดภาษีที่ถูกหักจริงตามหนังสือรับรองหรือข้อมูลจากผู้จ่ายเงิน"
                              value={
                                rentalIncome?.taxWithheld ?? 0
                              }
                              onChange={(value) =>
                                updateRentalIncome({
                                  taxWithheld: value,
                                })
                              }
                            />
                          </div>

                          <div className="mt-5">
                            <MoneyInput
                              label="เงินลงทุนเพื่อการอนุรักษ์พลังงาน"
                              description="กรอกเฉพาะยอดลงทุนในเครื่องจักร อุปกรณ์ประสิทธิภาพสูง หรือวัสดุเพื่อการอนุรักษ์พลังงานที่เข้าเงื่อนไข พ.ร.ฎ. 805 ระบบจะคำนวณสิทธิยกเว้นเพิ่มเติม 50% ของยอดนี้"
                              value={
                                rentalIncome
                                  ?.energyEfficientInvestment ?? 0
                              }
                              onChange={(value) =>
                                updateRentalIncome({
                                  energyEfficientInvestment:
                                    value,
                                })
                              }
                            />
                          </div>

                          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
                            <label className="flex cursor-pointer items-start gap-3">
                              <input
                                type="checkbox"
                                checked={
                                  rentalIncome?.isSublease ??
                                  false
                                }
                                onChange={(e) =>
                                  updateRentalIncome({
                                    isSublease:
                                      e.target.checked,
                                  })
                                }
                                className="mt-1 h-4 w-4 rounded border-slate-300"
                              />

                              <div>
                                <div className="font-medium text-slate-800">
                                  เป็นการให้เช่าช่วง
                                </div>

                                <div className="mt-1 text-sm leading-5 text-slate-500">
                                  เช่าทรัพย์สินจากผู้อื่นมา
                                  แล้วนำไปให้บุคคลอื่นเช่าต่อ
                                </div>
                              </div>
                            </label>
                          </div>

                          <div className="mt-5">
                            <div className="text-sm font-medium text-slate-700">
                              วิธีหักค่าใช้จ่าย
                            </div>

                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateRentalIncome({
                                    expenseMethod: "standard",
                                  })
                                }
                                className={`rounded-xl border px-4 py-3 text-left transition ${
                                  (rentalIncome?.expenseMethod ??
                                    "standard") === "standard"
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                }`}
                              >
                                <div className="font-medium">
                                  {rentalIncome?.isSublease
                                    ? "หักค่าเช่าที่จ่ายให้ผู้ให้เช่ารายเดิม"
                                    : "หักค่าใช้จ่ายแบบเหมา"}
                                </div>

                                <div className="mt-1 text-xs leading-5 opacity-75">
                                  {rentalIncome?.isSublease
                                    ? "ใช้ค่าเช่าที่จ่ายให้ผู้ให้เช่ารายเดิมเป็นค่าใช้จ่าย"
                                    : rentalStandardRate !== null
                                      ? `อัตรา ${(rentalStandardRate * 100).toFixed(0)}%`
                                      : "เลือกประเภททรัพย์สินเพื่อดูอัตรา"}
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  updateRentalIncome({
                                    expenseMethod: "actual",
                                  })
                                }
                                className={`rounded-xl border px-4 py-3 text-left transition ${
                                  rentalIncome?.expenseMethod ===
                                  "actual"
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                }`}
                              >
                                <div className="font-medium">
                                  หักค่าใช้จ่ายตามจริง
                                </div>

                                <div className="mt-1 text-xs leading-5 opacity-75">
                                  ใช้ค่าใช้จ่ายที่เกี่ยวข้องและมีหลักฐาน
                                </div>
                              </button>
                            </div>
                          </div>

                          {rentalIncome?.isSublease &&
                            rentalIncome.expenseMethod ===
                              "standard" && (
                              <div className="mt-5">
                                <MoneyInput
                                  label="ค่าเช่าที่จ่ายให้ผู้ให้เช่ารายเดิม"
                                  description="กรอกค่าเช่าที่จ่ายให้เจ้าของหรือผู้ให้เช่ารายเดิมสำหรับทรัพย์สินที่นำมาให้เช่าช่วง"
                                  value={
                                    rentalIncome.subleaseRentPaid
                                  }
                                  onChange={(value) =>
                                    updateRentalIncome({
                                      subleaseRentPaid: value,
                                    })
                                  }
                                />
                              </div>
                          )}

                          {rentalIncome?.expenseMethod ===
                            "actual" && (
                            <div className="mt-5">
                              <MoneyInput
                                label="ค่าใช้จ่ายตามจริง"
                                description="กรอกเฉพาะค่าใช้จ่ายที่เกี่ยวข้องกับการให้เช่าและมีหลักฐานรองรับ"
                                value={
                                  rentalIncome.actualExpense
                                }
                                onChange={(value) =>
                                  updateRentalIncome({
                                    actualExpense: value,
                                  })
                                }
                              />
                            </div>
                          )}
                        </div>

                        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              รายได้วิชาชีพอิสระ 40(6)
                            </h3>

                            <p className="mt-1 text-sm leading-6 text-slate-500">
                              เช่น การประกอบโรคศิลป ประณีตศิลปกรรม
                              กฎหมาย วิศวกรรม สถาปัตยกรรม และการบัญชี
                            </p>
                          </div>

                          <div className="mt-5 grid gap-5 md:grid-cols-2">
                            <MoneyInput
                              label="รายได้วิชาชีพอิสระทั้งปี"
                              value={
                                professionalIncome?.amount ?? 0
                              }
                              onChange={(value) =>
                                updateProfessionalIncome({
                                  amount: value,
                                })
                              }
                            />

                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                ประเภทวิชาชีพ
                              </label>

                              <select
                                value={
                                  professionalIncome
                                    ?.professionalType ?? ""
                                }
                                onChange={(e) =>
                                  updateProfessionalIncome({
                                    professionalType:
                                      e.target.value === ""
                                        ? null
                                        : (e.target
                                            .value as Section40_6ProfessionalIncomeData["professionalType"]),
                                  })
                                }
                                className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                              >
                                <option value="">
                                  เลือกประเภทวิชาชีพ
                                </option>

                                <option value="medical">
                                  การประกอบโรคศิลป
                                </option>

                                <option value="fineArts">
                                  ประณีตศิลปกรรม
                                </option>

                                <option value="other">
                                  วิชาชีพอื่น
                                </option>
                              </select>

                              {professionalIncome
                                ?.professionalType ===
                                "other" && (
                                <p className="mt-2 text-xs leading-5 text-slate-500">
                                  เช่น กฎหมาย วิศวกรรม
                                  สถาปัตยกรรม และการบัญชี
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-5">
                            <MoneyInput
                              label="ภาษีหัก ณ ที่จ่ายจากวิชาชีพอิสระ"
                              description="กรอกยอดภาษีที่ถูกหักจริงตามหนังสือรับรองหรือข้อมูลจากผู้จ่ายเงิน"
                              value={
                                professionalIncome?.taxWithheld ?? 0
                              }
                              onChange={(value) =>
                                updateProfessionalIncome({
                                  taxWithheld: value,
                                })
                              }
                            />
                          </div>

                          <div className="mt-5">
                            <MoneyInput
                              label="เงินลงทุนเพื่อการอนุรักษ์พลังงาน"
                              description="กรอกเฉพาะยอดลงทุนในเครื่องจักร อุปกรณ์ประสิทธิภาพสูง หรือวัสดุเพื่อการอนุรักษ์พลังงานที่เข้าเงื่อนไข พ.ร.ฎ. 805 ระบบจะคำนวณสิทธิยกเว้นเพิ่มเติม 50% ของยอดนี้"
                              value={
                                professionalIncome
                                  ?.energyEfficientInvestment ?? 0
                              }
                              onChange={(value) =>
                                updateProfessionalIncome({
                                  energyEfficientInvestment:
                                    value,
                                })
                              }
                            />
                          </div>

                          <div className="mt-5">
                            <div className="text-sm font-medium text-slate-700">
                              วิธีหักค่าใช้จ่าย
                            </div>

                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateProfessionalIncome({
                                    expenseMethod:
                                      "standard",
                                  })
                                }
                                className={`rounded-xl border px-4 py-3 text-left transition ${
                                  (professionalIncome
                                    ?.expenseMethod ??
                                    "standard") ===
                                  "standard"
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                }`}
                              >
                                <div className="font-medium">
                                  หักค่าใช้จ่ายแบบเหมา
                                </div>

                                <div className="mt-1 text-xs leading-5 opacity-75">
                                  {professionalStandardRate !==
                                  null
                                    ? `อัตรา ${(
                                        professionalStandardRate *
                                        100
                                      ).toFixed(0)}%`
                                    : "เลือกประเภทวิชาชีพเพื่อดูอัตรา"}
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  updateProfessionalIncome({
                                    expenseMethod:
                                      "actual",
                                  })
                                }
                                className={`rounded-xl border px-4 py-3 text-left transition ${
                                  professionalIncome
                                    ?.expenseMethod ===
                                  "actual"
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                }`}
                              >
                                <div className="font-medium">
                                  หักค่าใช้จ่ายตามจริง
                                </div>

                                <div className="mt-1 text-xs leading-5 opacity-75">
                                  ใช้ค่าใช้จ่ายที่เกี่ยวข้องกับการประกอบวิชาชีพและมีหลักฐาน
                                </div>
                              </button>
                            </div>
                          </div>

                          {professionalIncome
                            ?.expenseMethod === "actual" && (
                            <div className="mt-5">
                              <MoneyInput
                                label="ค่าใช้จ่ายตามจริง"
                                description="กรอกค่าใช้จ่ายที่เกี่ยวข้องกับการประกอบวิชาชีพ"
                                value={
                                  professionalIncome
                                    .actualExpense
                                }
                                onChange={(value) =>
                                  updateProfessionalIncome({
                                    actualExpense: value,
                                  })
                                }
                              />
                            </div>
                          )}
                        </div>

                        <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50/40 p-5">
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              รายได้จากการรับเหมา 40(7)
                            </h3>

                            <p className="mt-1 text-sm leading-6 text-slate-500">
                              งานรับเหมาที่ผู้รับเหมาต้องลงทุนจัดหาสัมภาระในส่วนสำคัญ
                              นอกจากเครื่องมือ
                            </p>
                          </div>

                          <div className="mt-5">
                            <MoneyInput
                              label="รายได้จากการรับเหมาทั้งปี"
                              value={
                                contractIncome?.amount ?? 0
                              }
                              onChange={(value) =>
                                updateContractIncome({
                                  amount: value,
                                })
                              }
                            />
                          </div>

                          <div className="mt-5">
                            <MoneyInput
                              label="ภาษีหัก ณ ที่จ่ายจากการรับเหมา"
                              description="กรอกยอดภาษีที่ถูกหักจริงตามหนังสือรับรองหรือข้อมูลจากผู้จ่ายเงิน"
                              value={
                                contractIncome?.taxWithheld ?? 0
                              }
                              onChange={(value) =>
                                updateContractIncome({
                                  taxWithheld: value,
                                })
                              }
                            />
                          </div>

                          <div className="mt-5">
                            <MoneyInput
                              label="เงินลงทุนเพื่อการอนุรักษ์พลังงาน"
                              description="กรอกเฉพาะยอดลงทุนในเครื่องจักร อุปกรณ์ประสิทธิภาพสูง หรือวัสดุเพื่อการอนุรักษ์พลังงานที่เข้าเงื่อนไข พ.ร.ฎ. 805 ระบบจะคำนวณสิทธิยกเว้นเพิ่มเติม 50% ของยอดนี้"
                              value={
                                contractIncome
                                  ?.energyEfficientInvestment ?? 0
                              }
                              onChange={(value) =>
                                updateContractIncome({
                                  energyEfficientInvestment:
                                    value,
                                })
                              }
                            />
                          </div>

                          <div className="mt-5">
                            <div className="text-sm font-medium text-slate-700">
                              วิธีหักค่าใช้จ่าย
                            </div>

                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateContractIncome({
                                    expenseMethod:
                                      "standard",
                                  })
                                }
                                className={`rounded-xl border px-4 py-3 text-left transition ${
                                  (contractIncome
                                    ?.expenseMethod ??
                                    "standard") ===
                                  "standard"
                                    ? "border-sky-500 bg-sky-50 text-sky-800"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                }`}
                              >
                                <div className="font-medium">
                                  หักค่าใช้จ่ายแบบเหมา
                                </div>

                                <div className="mt-1 text-xs leading-5 opacity-75">
                                  อัตรา{" "}
                                  {(
                                    contractStandardRate *
                                    100
                                  ).toFixed(0)}
                                  %
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  updateContractIncome({
                                    expenseMethod:
                                      "actual",
                                  })
                                }
                                className={`rounded-xl border px-4 py-3 text-left transition ${
                                  contractIncome
                                    ?.expenseMethod ===
                                  "actual"
                                    ? "border-sky-500 bg-sky-50 text-sky-800"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                }`}
                              >
                                <div className="font-medium">
                                  หักค่าใช้จ่ายตามจริง
                                </div>

                                <div className="mt-1 text-xs leading-5 opacity-75">
                                  ใช้ค่าใช้จ่ายที่เกี่ยวข้องกับการรับเหมาและมีหลักฐาน
                                </div>
                              </button>
                            </div>
                          </div>

                          {contractIncome
                            ?.expenseMethod === "actual" && (
                            <div className="mt-5">
                              <MoneyInput
                                label="ค่าใช้จ่ายตามจริง"
                                description="กรอกค่าใช้จ่ายที่เกี่ยวข้องกับการรับเหมา"
                                value={
                                  contractIncome.actualExpense
                                }
                                onChange={(value) =>
                                  updateContractIncome({
                                    actualExpense: value,
                                  })
                                }
                              />
                            </div>
                          )}
                        </div>

                        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/40 p-5">
                          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                            <div>
                              <h3 className="font-semibold text-slate-900">
                                รายได้ธุรกิจ / กิจการอื่น 40(8)
                              </h3>

                              <p className="mt-1 text-sm leading-6 text-slate-500">
                                เพิ่มรายการแยกตามประเภทกิจการ
                                เพื่อให้ระบบเลือกวิธีหักค่าใช้จ่ายได้ถูกต้อง
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={addBusinessIncome}
                              className="shrink-0 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-medium text-amber-800 transition hover:bg-amber-50"
                            >
                              + เพิ่มกิจการ
                            </button>
                          </div>

                          {businessIncomes.length === 0 && (
                            <div className="mt-5 rounded-xl border border-dashed border-amber-200 bg-white/70 px-4 py-5 text-center text-sm text-slate-500">
                              ยังไม่มีรายการรายได้ 40(8)
                              กด “เพิ่มกิจการ” เพื่อเริ่มกรอกข้อมูล
                            </div>
                          )}

                          {businessIncomes.length > 0 && (
                            <div className="mt-5 space-y-4">
                              {businessIncomes.map(
                                (item, index) => (
                                  <div
                                    key={item.id}
                                    className="rounded-xl border border-amber-200 bg-white p-4"
                                  >
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="font-medium text-slate-800">
                                        กิจการที่ {index + 1}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeBusinessIncome(
                                            item.id
                                          )
                                        }
                                        className="text-sm font-medium text-rose-600 transition hover:text-rose-700"
                                      >
                                        ลบรายการ
                                      </button>
                                    </div>

                                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                                      <MoneyInput
                                        label="รายได้ทั้งปี"
                                        value={item.amount}
                                        onChange={(value) =>
                                          updateBusinessIncome(
                                            item.id,
                                            {
                                              amount: value,
                                            }
                                          )
                                        }
                                      />

                                      <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                          กลุ่มกิจการ
                                        </label>

                                        <select
                                          value={
                                            item.category ?? ""
                                          }
                                          onChange={(e) => {
                                            const category =
                                              e.target.value === ""
                                                ? null
                                                : (e.target
                                                    .value as Section40_8BusinessIncomeData["category"]);

                                            updateBusinessIncome(
                                              item.id,
                                              {
                                                category,

                                                ...(category ===
                                                "actualOnly"
                                                  ? {
                                                      expenseMethod:
                                                        "actual" as const,
                                                    }
                                                  : {}),
                                              }
                                            );
                                          }}
                                          className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                        >
                                          <option value="">
                                            เลือกกลุ่มกิจการ
                                          </option>

                                          <option value="standard60">
                                            กิจการที่หักค่าใช้จ่ายเหมา 60% ได้
                                          </option>

                                          <option value="performer">
                                            นักแสดง / งานบันเทิง / นักกีฬาอาชีพ
                                          </option>

                                          <option value="actualOnly">
                                            กิจการที่หักค่าใช้จ่ายตามจริงเท่านั้น
                                          </option>
                                        </select>
                                      </div>
                                    </div>

                                    <div className="mt-5">
                                      <MoneyInput
                                        label="ภาษีหัก ณ ที่จ่ายของกิจการนี้"
                                        description="กรอกยอดภาษีที่ถูกหักจริงสำหรับกิจการนี้ตามหนังสือรับรองหรือข้อมูลจากผู้จ่ายเงิน"
                                        value={
                                          item.taxWithheld ?? 0
                                        }
                                        onChange={(value) =>
                                          updateBusinessIncome(
                                            item.id,
                                            {
                                              taxWithheld: value,
                                            }
                                          )
                                        }
                                      />
                                    </div>

                                    <div className="mt-5">
                                      <MoneyInput
                                        label="เงินลงทุนเพื่อการอนุรักษ์พลังงานของกิจการนี้"
                                        description="กรอกเฉพาะยอดลงทุนที่เข้าเงื่อนไข พ.ร.ฎ. 805 ระบบจะคำนวณสิทธิยกเว้นเพิ่มเติม 50% ของยอดนี้"
                                        value={
                                          item.energyEfficientInvestment ??
                                          0
                                        }
                                        onChange={(value) =>
                                          updateBusinessIncome(
                                            item.id,
                                            {
                                              energyEfficientInvestment:
                                                value,
                                            }
                                          )
                                        }
                                      />
                                    </div>

                                    {item.category ===
                                      "performer" && (
                                      <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                                        กรณีผู้แสดง:
                                        เงินได้{" "}
                                        {formatNumber(
                                          performerFirstTierLimit
                                        )}{" "}
                                        บาทแรก หักค่าใช้จ่ายเหมา{" "}
                                        {(
                                          performerFirstTierRate *
                                          100
                                        ).toFixed(0)}
                                        % ส่วนที่เกินหัก{" "}
                                        {(
                                          performerExcessRate *
                                          100
                                        ).toFixed(0)}
                                        % และค่าใช้จ่ายเหมารวมไม่เกิน{" "}
                                        {formatNumber(
                                          performerMaxExpense
                                        )}{" "}
                                        บาท
                                      </div>
                                    )}

                                    {item.category ===
                                      "actualOnly" && (
                                      <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                                        กิจการกลุ่มนี้ไม่ใช้ค่าใช้จ่ายแบบเหมา
                                        ระบบจะใช้ค่าใช้จ่ายตามจริง
                                      </div>
                                    )}

                                    <div className="mt-5">
                                      <label className="mb-2 block text-sm font-medium text-slate-700">
                                        ประเภท / ลักษณะกิจการ
                                      </label>

                                      <input
                                        type="text"
                                        value={
                                          item.activityCode ?? ""
                                        }
                                        onChange={(e) =>
                                          updateBusinessIncome(
                                            item.id,
                                            {
                                              activityCode:
                                                e.target.value,
                                            }
                                          )
                                        }
                                        onBlur={(e) =>
                                          updateBusinessIncome(
                                            item.id,
                                            {
                                              activityCode:
                                                e.target.value
                                                  .trim() || null,
                                            }
                                          )
                                        }
                                        placeholder="เช่น ร้านอาหาร, ขายสินค้าออนไลน์, งานแสดง"
                                        className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                      />

                                      <p className="mt-2 text-xs leading-5 text-slate-500">
                                        หากมีหลายรายการจากกิจการประเภทเดียวกัน
                                        ให้ใช้ชื่อเดียวกัน
                                        เพื่อให้ระบบตรวจสอบวิธีหักค่าใช้จ่ายได้ถูกต้อง
                                      </p>
                                    </div>

                                    {item.category &&
                                      item.category !== "actualOnly" && (
                                        <div className="mt-5">
                                          <div className="text-sm font-medium text-slate-700">
                                            วิธีหักค่าใช้จ่าย
                                          </div>

                                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                updateBusinessIncome(
                                                  item.id,
                                                  {
                                                    expenseMethod:
                                                      "standard",
                                                  }
                                                )
                                              }
                                              className={`rounded-xl border px-4 py-3 text-left transition ${
                                                item.expenseMethod ===
                                                "standard"
                                                  ? "border-amber-500 bg-amber-50 text-amber-800"
                                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                              }`}
                                            >
                                              <div className="font-medium">
                                                หักค่าใช้จ่ายแบบเหมา
                                              </div>

                                              <div className="mt-1 text-xs leading-5 opacity-75">
                                                {item.category ===
                                                  "standard60"
                                                    ? `อัตรา ${(
                                                        businessStandardRate * 100
                                                      ).toFixed(0)}%`
                                                    : "ใช้อัตราสำหรับผู้แสดง"}
                                              </div>
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() =>
                                                updateBusinessIncome(
                                                  item.id,
                                                  {
                                                    expenseMethod:
                                                      "actual",
                                                  }
                                                )
                                              }
                                              className={`rounded-xl border px-4 py-3 text-left transition ${
                                                item.expenseMethod ===
                                                "actual"
                                                  ? "border-amber-500 bg-amber-50 text-amber-800"
                                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                              }`}
                                            >
                                              <div className="font-medium">
                                                หักค่าใช้จ่ายตามจริง
                                              </div>

                                              <div className="mt-1 text-xs leading-5 opacity-75">
                                                ใช้ค่าใช้จ่ายที่เกี่ยวข้องกับกิจการและมีหลักฐาน
                                              </div>
                                            </button>
                                          </div>
                                        </div>
                                      )}

                                    {item.category ===
                                      "actualOnly" && (
                                      <div className="mt-5">
                                        <div className="text-sm font-medium text-slate-700">
                                          วิธีหักค่าใช้จ่าย
                                        </div>

                                        <div className="mt-3 rounded-xl border border-amber-500 bg-amber-50 px-4 py-3 text-amber-800">
                                          <div className="font-medium">
                                            หักค่าใช้จ่ายตามจริง
                                          </div>

                                          <div className="mt-1 text-xs leading-5 opacity-75">
                                            กิจการประเภทนี้ไม่สามารถเลือกหักค่าใช้จ่ายแบบเหมา
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {item.expenseMethod ===
                                      "actual" &&
                                      item.category && (
                                        <div className="mt-5">
                                          <MoneyInput
                                            label="ค่าใช้จ่ายตามจริง"
                                            description="กรอกเฉพาะค่าใช้จ่ายที่เกี่ยวข้องกับกิจการ"
                                            value={
                                              item.actualExpense
                                            }
                                            onChange={(value) =>
                                              updateBusinessIncome(
                                                item.id,
                                                {
                                                  actualExpense:
                                                    value,
                                                }
                                              )
                                            }
                                          />
                                        </div>
                                      )
                                    }

                                    {item.amount > 0 &&
                                      item.category === null && (
                                        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                                          กรุณาเลือกกลุ่มกิจการ
                                          เพื่อให้ระบบคำนวณค่าใช้จ่ายของรายได้ 40(8)
                                          ได้ครบถ้วน
                                        </div>
                                      )}

                                    {item.amount > 0 &&
                                      item.category &&
                                      conflictingBusinessActivityKeys.has(
                                        `${
                                          item.category
                                        }:${
                                          item.activityCode?.trim() ||
                                          "__unspecified__"
                                        }`
                                      ) && (
                                        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                                          กิจการประเภทเดียวกันกำลังใช้วิธีหักค่าใช้จ่ายต่างกัน
                                          กรุณาเลือกวิธีหักค่าใช้จ่ายให้เหมือนกัน
                                        </div>
                                      )}

                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>
                </div>
              )}
            </div>

            <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">

              <Link
                href="/"
                className="rounded-xl px-5 py-3 font-medium text-slate-500 transition hover:bg-slate-100"
              >
                ← ย้อนกลับ
              </Link>

              <Link
                href="/planning/family"
                className="rounded-xl bg-blue-600 px-7 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                ถัดไป →
              </Link>
            </div>
          </section>

          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 min-[960px]:sticky min-[960px]:top-8">

            <div className="text-sm font-medium text-slate-500">
              สรุปรายได้
            </div>

            <div className="mt-5">
              <div className="text-sm text-slate-500">
                รายได้ที่นำมารวมคำนวณปีนี้
              </div>

              <div className="mt-1 break-words text-2xl font-bold text-slate-900 sm:text-3xl">
                {formatNumber(
                  totalIncome
                )}
              </div>

              <div className="mt-1 text-sm text-slate-400">
                บาท
              </div>
            </div>

            <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm">

              <SummaryRow
                label="เงินเดือน"
                value={
                  annualSalary
                }
              />

              <SummaryRow
                label="โบนัส"
                value={
                  income.annualBonus
                }
              />

              <SummaryRow
                label="รายได้จากงานอื่น"
                value={
                  income.otherEmploymentIncome
                }
              />

              {totalSection40_1ForeignIncome >
                0 && (
                <>
                  <SummaryRow
                    label="รายได้ต่างประเทศ 40(1) ทั้งก้อน"
                    value={
                      totalSection40_1ForeignIncome
                    }
                  />

                  <SummaryRow
                    label={`ส่วนที่นำมาคำนวณปี ${state.taxYear}`}
                    value={
                      taxableSection40_1ForeignIncome
                    }
                  />
                </>
              )}

              {totalSection40_2ForeignIncome > 0 && (
                <>
                  <SummaryRow
                    label="รายได้ต่างประเทศ 40(2) ทั้งก้อน"
                    value={totalSection40_2ForeignIncome}
                  />

                  <SummaryRow
                    label={`40(2) ส่วนที่นำมาคำนวณปี ${state.taxYear}`}
                    value={taxableSection40_2ForeignIncome}
                  />
                </>
              )}

              {shouldShowOtherIncomeSummary && (
                <SummaryRow
                  label="รายได้ประเภทอื่น"
                  value={
                    totalOtherIncome +
                    legacyRentIncome +
                    legacyProfessionalIncome +
                    totalSection40_3Income +
                    totalInterestIncome +
                    totalDividendIncome +
                    totalRentalIncome +
                    totalProfessionalIncome +
                    legacyBusinessIncome +
                    totalContractIncome +
                    totalBusinessIncome
                  }
                />
              )}
            </div>

            {foreignIncomeAggregate.items.length >
              0 &&
              !foreignIncomeAggregate.isComplete && (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                  <div className="font-medium">
                    ข้อมูลรายได้ต่างประเทศยังไม่ครบ
                  </div>

                  <div className="mt-1">
                    ยอดรายได้ที่นำมารวมคำนวณด้านบน
                    อาจยังเปลี่ยนแปลงได้
                    กรุณาตรวจสอบรายการรายได้ต่างประเทศที่มีคำเตือน
                  </div>
                </div>
              )}

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
              ยอดรวมด้านบนเป็นรายได้ที่นำมารวมคำนวณในปีภาษีนี้
              ก่อนหักค่าใช้จ่ายและค่าลดหย่อน
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function MoneyInput({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (
    value: number
  ) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      {description && (
        <p className="mb-2 text-sm text-slate-400">
          {description}
        </p>
      )}

      <div className="relative">
        <input
          inputMode="numeric"
          value={
            value
              ? formatNumber(value)
              : ""
          }
          onChange={(e) =>
            onChange(
              parseNumber(
                e.target.value
              )
            )
          }
          placeholder="0"
          className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 pr-16 text-lg text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />

        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
          บาท
        </span>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex justify-between gap-3">

      <span className="text-slate-500">
        {label}
      </span>

      <span className="font-medium text-slate-800">
        {formatNumber(value)}
      </span>

    </div>
  );
}