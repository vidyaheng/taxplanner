import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateSection40_3RightsExpense,
  calculateSection40_5RentalExpense,
  calculateSection40_6ProfessionalExpense,
  calculateSection40_7ContractExpense,
  calculateSection40_8BusinessExpense,
} from "./income-expense";

const rule = {
  standardRate: 0.5,
  standardMax: 100_000,
};

const rentalRule = {
  standardRates: {
    building: 0.30,
    agriculturalLand: 0.20,
    nonAgriculturalLand: 0.15,
    vehicle: 0.30,
    otherProperty: 0.10,
  },
};

const professionalRule = {
  standardRates: {
    medical: 0.60,
    fineArts: 0.60,
    other: 0.30,
  },
};

const contractRule = {
  standardRate: 0.60,
};

const businessRule = {
  standardRate: 0.60,

  performer: {
    firstTierLimit: 300_000,
    firstTierRate: 0.60,
    excessRate: 0.40,
    maxExpense: 600_000,
  },
};

describe(
  "Section 40(3) rights expense",
  () => {
    it(
      "หักค่าใช้จ่ายเหมา 50% เมื่อยังไม่ถึงเพดาน",
      () => {
        const result =
          calculateSection40_3RightsExpense(
            [
              {
                id: "r1",
                incomeType:
                  "rights",
                amount:
                  120_000,
                expenseMethod:
                  "standard",
                actualExpense:
                  0,
              },
            ],
            rule
          );

        expect(
          result.grossIncome
        ).toBe(120_000);

        expect(
          result.expenseBeforeCap
        ).toBe(60_000);

        expect(
          result.deductibleExpense
        ).toBe(60_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "หลายรายการใช้เพดานค่าใช้จ่ายเหมา 100,000 บาทร่วมกัน",
      () => {
        const result =
          calculateSection40_3RightsExpense(
            [
              {
                id: "r1",
                incomeType:
                  "rights",
                amount:
                  150_000,
                expenseMethod:
                  "standard",
                actualExpense:
                  0,
              },

              {
                id: "r2",
                incomeType:
                  "rights",
                amount:
                  150_000,
                expenseMethod:
                  "standard",
                actualExpense:
                  0,
              },
            ],
            rule
          );

        expect(
          result.grossIncome
        ).toBe(300_000);

        expect(
          result.expenseBeforeCap
        ).toBe(150_000);

        expect(
          result.deductibleExpense
        ).toBe(100_000);
      }
    );

    it(
      "รองรับค่าใช้จ่ายตามจริงโดยไม่ใช้เพดานเหมา 100,000 บาท",
      () => {
        const result =
          calculateSection40_3RightsExpense(
            [
              {
                id: "r1",
                incomeType:
                  "rights",
                amount:
                  300_000,
                expenseMethod:
                  "actual",
                actualExpense:
                  180_000,
              },
            ],
            rule
          );

        expect(
          result.grossIncome
        ).toBe(300_000);

        expect(
          result.deductibleExpense
        ).toBe(180_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );
  }
);

describe(
  "Section 40(5) rental expense",
  () => {
    it(
      "หักค่าใช้จ่ายเหมาตามประเภททรัพย์สิน",
      () => {
        const result =
          calculateSection40_5RentalExpense(
            [
              {
                id: "building-1",
                amount: 100_000,
                assetType: "building",
                expenseMethod: "standard",
                actualExpense: 0,
                isSublease: false,
                subleaseRentPaid: 0,
              },
              {
                id: "agri-1",
                amount: 100_000,
                assetType: "agriculturalLand",
                expenseMethod: "standard",
                actualExpense: 0,
                isSublease: false,
                subleaseRentPaid: 0,
              },
              {
                id: "land-1",
                amount: 100_000,
                assetType: "nonAgriculturalLand",
                expenseMethod: "standard",
                actualExpense: 0,
                isSublease: false,
                subleaseRentPaid: 0,
              },
              {
                id: "vehicle-1",
                amount: 100_000,
                assetType: "vehicle",
                expenseMethod: "standard",
                actualExpense: 0,
                isSublease: false,
                subleaseRentPaid: 0,
              },
              {
                id: "property-1",
                amount: 100_000,
                assetType: "otherProperty",
                expenseMethod: "standard",
                actualExpense: 0,
                isSublease: false,
                subleaseRentPaid: 0,
              },
            ],
            rentalRule
          );

        expect(
          result.grossIncome
        ).toBe(500_000);

        /*
         * 30,000
         * + 20,000
         * + 15,000
         * + 30,000
         * + 10,000
         * = 105,000
         */
        expect(
          result.deductibleExpense
        ).toBe(105_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "รองรับค่าใช้จ่ายตามจริง",
      () => {
        const result =
          calculateSection40_5RentalExpense(
            [
              {
                id: "building-actual",
                amount: 300_000,
                assetType: "building",
                expenseMethod: "actual",
                actualExpense: 180_000,
                isSublease: false,
                subleaseRentPaid: 0,
              },
            ],
            rentalRule
          );

        expect(
          result.grossIncome
        ).toBe(300_000);

        expect(
          result.deductibleExpense
        ).toBe(180_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "กรณีเช่าช่วงใช้ค่าเช่าที่จ่ายให้ผู้ให้เช่าเดิม",
      () => {
        const result =
          calculateSection40_5RentalExpense(
            [
              {
                id: "sublease-1",
                amount: 300_000,
                assetType: "building",
                expenseMethod: "standard",
                actualExpense: 0,
                isSublease: true,
                subleaseRentPaid: 180_000,
              },
            ],
            rentalRule
          );

        expect(
          result.grossIncome
        ).toBe(300_000);

        expect(
          result.deductibleExpense
        ).toBe(180_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "ถือว่าข้อมูลไม่สมบูรณ์เมื่อยังไม่ได้เลือกประเภททรัพย์สิน",
      () => {
        const result =
          calculateSection40_5RentalExpense(
            [
              {
                id: "unknown-asset",
                amount: 100_000,
                assetType: null,
                expenseMethod: "standard",
                actualExpense: 0,
                isSublease: false,
                subleaseRentPaid: 0,
              },
            ],
            rentalRule
          );

        expect(
          result.grossIncome
        ).toBe(100_000);

        expect(
          result.deductibleExpense
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(false);
      }
    );

    it(
      "ถือว่าข้อมูลไม่สมบูรณ์เมื่อทรัพย์สินประเภทเดียวกันใช้วิธีหักค่าใช้จ่ายต่างกัน",
      () => {
        const result =
          calculateSection40_5RentalExpense(
            [
              {
                id: "building-standard",
                amount: 100_000,
                assetType: "building",
                expenseMethod: "standard",
                actualExpense: 0,
                isSublease: false,
                subleaseRentPaid: 0,
              },
              {
                id: "building-actual",
                amount: 100_000,
                assetType: "building",
                expenseMethod: "actual",
                actualExpense: 60_000,
                isSublease: false,
                subleaseRentPaid: 0,
              },
            ],
            rentalRule
          );

        expect(
          result.grossIncome
        ).toBe(200_000);

        expect(
          result.deductibleExpense
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(false);
      }
    );
  }
);

describe(
  "Section 40(6) professional expense",
  () => {
    it(
      "หักค่าใช้จ่ายเหมาตามประเภทวิชาชีพ 60% 60% และ 30%",
      () => {
        const result =
          calculateSection40_6ProfessionalExpense(
            [
              {
                id: "medical-1",
                amount: 100_000,
                professionalType:
                  "medical",
                expenseMethod:
                  "standard",
                actualExpense: 0,
              },
              {
                id: "fine-arts-1",
                amount: 100_000,
                professionalType:
                  "fineArts",
                expenseMethod:
                  "standard",
                actualExpense: 0,
              },
              {
                id: "other-1",
                amount: 100_000,
                professionalType:
                  "other",
                expenseMethod:
                  "standard",
                actualExpense: 0,
              },
            ],
            professionalRule
          );

        expect(
          result.grossIncome
        ).toBe(300_000);

        expect(
          result.deductibleExpense
        ).toBe(150_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "รองรับค่าใช้จ่ายตามจริง",
      () => {
        const result =
          calculateSection40_6ProfessionalExpense(
            [
              {
                id: "medical-actual",
                amount: 300_000,
                professionalType:
                  "medical",
                expenseMethod:
                  "actual",
                actualExpense:
                  180_000,
              },
            ],
            professionalRule
          );

        expect(
          result.grossIncome
        ).toBe(300_000);

        expect(
          result.deductibleExpense
        ).toBe(180_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "ถือว่าข้อมูลไม่สมบูรณ์เมื่อยังไม่ระบุประเภทวิชาชีพ",
      () => {
        const result =
          calculateSection40_6ProfessionalExpense(
            [
              {
                id: "unknown-profession",
                amount: 100_000,
                professionalType:
                  null,
                expenseMethod:
                  "standard",
                actualExpense: 0,
              },
            ],
            professionalRule
          );

        expect(
          result.grossIncome
        ).toBe(100_000);

        expect(
          result.deductibleExpense
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(false);
      }
    );

    it(
      "ถือว่าข้อมูลไม่สมบูรณ์เมื่อวิชาชีพประเภทเดียวกันใช้วิธีหักค่าใช้จ่ายต่างกัน",
      () => {
        const result =
          calculateSection40_6ProfessionalExpense(
            [
              {
                id: "medical-standard",
                amount: 100_000,
                professionalType:
                  "medical",
                expenseMethod:
                  "standard",
                actualExpense: 0,
              },
              {
                id: "medical-actual",
                amount: 100_000,
                professionalType:
                  "medical",
                expenseMethod:
                  "actual",
                actualExpense:
                  60_000,
              },
            ],
            professionalRule
          );

        expect(
          result.grossIncome
        ).toBe(200_000);

        expect(
          result.deductibleExpense
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(false);
      }
    );
  }
);

describe(
  "Section 40(7) contract expense",
  () => {
    it(
      "หักค่าใช้จ่ายเหมา 60%",
      () => {
        const result =
          calculateSection40_7ContractExpense(
            [
              {
                id: "contract-standard",
                amount: 300_000,
                expenseMethod: "standard",
                actualExpense: 0,
              },
            ],
            contractRule
          );

        expect(result.grossIncome).toBe(300_000);
        expect(result.deductibleExpense).toBe(180_000);
        expect(result.isComplete).toBe(true);
      }
    );

    it(
      "รองรับค่าใช้จ่ายตามจริง",
      () => {
        const result =
          calculateSection40_7ContractExpense(
            [
              {
                id: "contract-actual",
                amount: 300_000,
                expenseMethod: "actual",
                actualExpense: 210_000,
              },
            ],
            contractRule
          );

        expect(result.grossIncome).toBe(300_000);
        expect(result.deductibleExpense).toBe(210_000);
        expect(result.isComplete).toBe(true);
      }
    );

    it(
      "ถือว่าข้อมูลไม่สมบูรณ์เมื่อใช้วิธีหักค่าใช้จ่ายปะปนกัน",
      () => {
        const result =
          calculateSection40_7ContractExpense(
            [
              {
                id: "contract-standard",
                amount: 100_000,
                expenseMethod: "standard",
                actualExpense: 0,
              },
              {
                id: "contract-actual",
                amount: 100_000,
                expenseMethod: "actual",
                actualExpense: 70_000,
              },
            ],
            contractRule
          );

        expect(result.grossIncome).toBe(200_000);
        expect(result.deductibleExpense).toBe(0);
        expect(result.isComplete).toBe(false);
      }
    );
  }
);

describe(
  "Section 40(8) business expense",
  () => {
    it(
      "หักค่าใช้จ่ายเหมา 60% สำหรับกิจการที่มีสิทธิหักเหมา",
      () => {
        const result =
          calculateSection40_8BusinessExpense(
            [
              {
                id: "business-standard",
                amount: 300_000,
                category: "standard60",
                expenseMethod: "standard",
                actualExpense: 0,
              },
            ],
            businessRule
          );

        expect(
          result.grossIncome
        ).toBe(300_000);

        expect(
          result.deductibleExpense
        ).toBe(180_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "นักแสดงหักเหมา 60% สำหรับรายได้ 300,000 บาทแรก",
      () => {
        const result =
          calculateSection40_8BusinessExpense(
            [
              {
                id: "performer-first-tier",
                amount: 300_000,
                category: "performer",
                expenseMethod: "standard",
                actualExpense: 0,
              },
            ],
            businessRule
          );

        expect(
          result.grossIncome
        ).toBe(300_000);

        expect(
          result.deductibleExpense
        ).toBe(180_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "นักแสดงรวมหลายรายการก่อนคำนวณ 60% และ 40%",
      () => {
        const result =
          calculateSection40_8BusinessExpense(
            [
              {
                id: "performer-1",
                amount: 200_000,
                category: "performer",
                expenseMethod: "standard",
                actualExpense: 0,
              },
              {
                id: "performer-2",
                amount: 200_000,
                category: "performer",
                expenseMethod: "standard",
                actualExpense: 0,
              },
            ],
            businessRule
          );

        expect(
          result.grossIncome
        ).toBe(400_000);

        /*
        * 300,000 × 60% = 180,000
        * 100,000 × 40% = 40,000
        * รวม 220,000
        */
        expect(
          result.deductibleExpense
        ).toBe(220_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "ค่าใช้จ่ายเหมาของนักแสดงไม่เกิน 600,000 บาท",
      () => {
        const result =
          calculateSection40_8BusinessExpense(
            [
              {
                id: "performer-cap",
                amount: 2_000_000,
                category: "performer",
                expenseMethod: "standard",
                actualExpense: 0,
              },
            ],
            businessRule
          );

        expect(
          result.grossIncome
        ).toBe(2_000_000);

        expect(
          result.deductibleExpense
        ).toBe(600_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "กิจการที่มีสิทธิหักเหมาเลือกหักค่าใช้จ่ายตามจริงได้",
      () => {
        const result =
          calculateSection40_8BusinessExpense(
            [
              {
                id: "business-actual",
                amount: 300_000,
                category: "standard60",
                expenseMethod: "actual",
                actualExpense: 210_000,
              },
            ],
            businessRule
          );

        expect(
          result.grossIncome
        ).toBe(300_000);

        expect(
          result.deductibleExpense
        ).toBe(210_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "นักแสดงเลือกหักค่าใช้จ่ายตามจริงได้โดยไม่ใช้เพดานค่าใช้จ่ายเหมา",
      () => {
        const result =
          calculateSection40_8BusinessExpense(
            [
              {
                id: "performer-actual",
                amount: 1_000_000,
                category: "performer",
                expenseMethod: "actual",
                actualExpense: 700_000,
              },
            ],
            businessRule
          );

        expect(
          result.grossIncome
        ).toBe(1_000_000);

        expect(
          result.deductibleExpense
        ).toBe(700_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "กิจการที่ไม่มีสิทธิหักเหมาใช้ค่าใช้จ่ายตามจริงได้",
      () => {
        const result =
          calculateSection40_8BusinessExpense(
            [
              {
                id: "actual-only",
                amount: 300_000,
                category: "actualOnly",
                expenseMethod: "actual",
                actualExpense: 180_000,
              },
            ],
            businessRule
          );

        expect(
          result.grossIncome
        ).toBe(300_000);

        expect(
          result.deductibleExpense
        ).toBe(180_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "ถือว่าข้อมูลไม่สมบูรณ์เมื่อกิจการที่หักได้เฉพาะตามจริงเลือกวิธีเหมา",
      () => {
        const result =
          calculateSection40_8BusinessExpense(
            [
              {
                id: "actual-only-invalid",
                amount: 300_000,
                category: "actualOnly",
                expenseMethod: "standard",
                actualExpense: 0,
              },
            ],
            businessRule
          );

        expect(
          result.grossIncome
        ).toBe(300_000);

        expect(
          result.deductibleExpense
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(false);
      }
    );

    it(
      "ถือว่าข้อมูลไม่สมบูรณ์เมื่อยังไม่ได้ระบุประเภทกิจการ",
      () => {
        const result =
          calculateSection40_8BusinessExpense(
            [
              {
                id: "unknown-business",
                amount: 100_000,
                category: null,
                expenseMethod: "standard",
                actualExpense: 0,
              },
            ],
            businessRule
          );

        expect(
          result.grossIncome
        ).toBe(100_000);

        expect(
          result.deductibleExpense
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(false);
      }
    );

    it(
      "กิจการชนิดเดียวกันต้องใช้วิธีหักค่าใช้จ่ายเดียวกัน",
      () => {
        const result =
          calculateSection40_8BusinessExpense(
            [
              {
                id: "restaurant-standard",
                amount: 100_000,
                category: "standard60",
                activityCode: "restaurant",
                expenseMethod: "standard",
                actualExpense: 0,
              },
              {
                id: "restaurant-actual",
                amount: 100_000,
                category: "standard60",
                activityCode: "restaurant",
                expenseMethod: "actual",
                actualExpense: 70_000,
              },
            ],
            businessRule
          );

        expect(
          result.grossIncome
        ).toBe(200_000);

        expect(
          result.deductibleExpense
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(false);
      }
    );

    it(
      "กิจการคนละชนิดสามารถเลือกวิธีหักค่าใช้จ่ายต่างกันได้",
      () => {
        const result =
          calculateSection40_8BusinessExpense(
            [
              {
                id: "restaurant-standard",
                amount: 100_000,
                category: "standard60",
                activityCode: "restaurant",
                expenseMethod: "standard",
                actualExpense: 0,
              },
              {
                id: "retail-actual",
                amount: 100_000,
                category: "standard60",
                activityCode: "retail",
                expenseMethod: "actual",
                actualExpense: 70_000,
              },
            ],
            businessRule
          );

        expect(
          result.grossIncome
        ).toBe(200_000);

        /*
        * restaurant:
        * 100,000 × 60% = 60,000
        *
        * retail:
        * actualExpense = 70,000
        *
        * รวม 130,000
        */
        expect(
          result.deductibleExpense
        ).toBe(130_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "ข้อมูลเก่าที่ไม่มี activityCode จะไม่ถูกเดาว่าเป็นคนละชนิดกิจการ",
      () => {
        const result =
          calculateSection40_8BusinessExpense(
            [
              {
                id: "legacy-standard",
                amount: 100_000,
                category: "standard60",
                expenseMethod: "standard",
                actualExpense: 0,
              },
              {
                id: "legacy-actual",
                amount: 100_000,
                category: "standard60",
                expenseMethod: "actual",
                actualExpense: 70_000,
              },
            ],
            businessRule
          );

        expect(
          result.grossIncome
        ).toBe(200_000);

        expect(
          result.deductibleExpense
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(false);
      }
    );
  }
);