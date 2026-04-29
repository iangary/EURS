import { z } from "zod";

export const BloodTypeEnum = z.enum(["A", "B", "O", "AB"]);
export const GenderEnum = z.enum(["MALE", "FEMALE"]);
export const UniformActionEnum = z.enum(["NEW", "REPLACE", "PURCHASE"]);

export const HelmetItemSchema = z.object({
  wearerAcc: z.string().trim().min(1, "使用人工號為必填"),
  userName: z.string().trim().min(1, "使用人姓名為必填"),
  userDept: z.string().optional().default(""),
  bloodType: BloodTypeEnum,
});

export const ShoesItemSchema = z.object({
  wearerAcc: z.string().trim().min(1, "使用人工號為必填"),
  userName: z.string().trim().min(1, "使用人姓名為必填"),
  userDept: z.string().optional().default(""),
  shoeSize: z.coerce.number().int().min(30).max(50),
  reason: z.string().trim().min(1, "說明原因為必填"),
});

export const UniformItemSchema = z
  .object({
    wearerAcc: z.string().trim().min(1, "使用人工號為必填"),
    userName: z.string().trim().min(1, "使用人姓名為必填"),
    userDept: z.string().optional().default(""),
    gender: GenderEnum,
    topSelected: z.boolean(),
    topSize: z.string().optional(),
    topQty: z.coerce.number().int().min(1).max(5).optional(),
    topAction: UniformActionEnum.optional(),
    pantsSelected: z.boolean(),
    pantsWaist: z.coerce.number().int().optional(),
    pantsLength: z.coerce.number().int().optional(),
    pantsQty: z.coerce.number().int().min(1).max(5).optional(),
    pantsAction: UniformActionEnum.optional(),
  })
  .refine((v) => v.topSelected || v.pantsSelected, {
    message: "上衣與折褲至少需勾選一項",
  })
  .refine((v) => !v.topSelected || (v.topSize && v.topQty && v.topAction), {
    message: "上衣需填寫尺寸、數量與領用方式",
  })
  .refine(
    (v) =>
      !v.pantsSelected ||
      (v.pantsWaist && v.pantsLength && v.pantsQty && v.pantsAction),
    { message: "折褲需填寫腰圍、褲長、數量與領用方式" }
  );

export const HelmetRequestSchema = z.object({
  remark: z.string().optional().nullable(),
  items: z.array(HelmetItemSchema).min(1, "至少需一筆使用人"),
});

export const ShoesRequestSchema = z.object({
  remark: z.string().optional().nullable(),
  items: z.array(ShoesItemSchema).min(1, "至少需一筆使用人"),
});

export const UniformRequestSchema = z.object({
  remark: z.string().optional().nullable(),
  items: z.array(UniformItemSchema).min(1, "至少需一筆使用人"),
  // 附件 id 在送出後另行掛接（uploads → request）
  attachmentIds: z.array(z.string()).optional().default([]),
});

export type HelmetRequestInput = z.infer<typeof HelmetRequestSchema>;
export type ShoesRequestInput = z.infer<typeof ShoesRequestSchema>;
export type UniformRequestInput = z.infer<typeof UniformRequestSchema>;
