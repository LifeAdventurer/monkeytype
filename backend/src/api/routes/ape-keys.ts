import joi from "joi";
import { Router } from "express";
import { authenticateRequest } from "../../middlewares/auth";
import * as ApeKeyController from "../controllers/ape-key";
import * as RateLimit from "../../middlewares/rate-limit";
import { checkUserPermissions } from "../../middlewares/permission";
import { validate } from "../../middlewares/configuration";
import { asyncHandler } from "../../middlewares/utility";
import { validateRequest } from "../../middlewares/validation";

const apeKeyNameSchema = joi
  .string()
  .regex(/^[0-9a-zA-Z_.-]+$/)
  .max(20)
  .messages({
    "string.pattern.base": "Invalid ApeKey name",
    "string.max": "ApeKey name exceeds maximum of 20 characters",
  });

const checkIfUserCanManageApeKeys = checkUserPermissions({
  criteria: (user) => {
    // Must be an exact check
    return user.canManageApeKeys !== false;
  },
  invalidMessage: "You have lost access to ape keys, please contact support",
});

const router = Router();

router.use(
  validate({
    criteria: (configuration) => {
      return configuration.apeKeys.endpointsEnabled;
    },
    invalidMessage: "ApeKeys are currently disabled.",
  })
);

router.get(
  "/",
  authenticateRequest(),
  RateLimit.apeKeysGet,
  checkIfUserCanManageApeKeys,
  asyncHandler(ApeKeyController.getApeKeys)
);

router.post(
  "/",
  authenticateRequest(),
  RateLimit.apeKeysGenerate,
  checkIfUserCanManageApeKeys,
  validateRequest({
    body: {
      name: apeKeyNameSchema.required(),
      enabled: joi.boolean().required(),
    },
  }),
  asyncHandler(ApeKeyController.generateApeKey)
);

router.patch(
  "/:apeKeyId",
  authenticateRequest(),
  RateLimit.apeKeysUpdate,
  checkIfUserCanManageApeKeys,
  validateRequest({
    params: {
      apeKeyId: joi.string().token().required(),
    },
    body: {
      name: apeKeyNameSchema,
      enabled: joi.boolean(),
    },
  }),
  asyncHandler(ApeKeyController.editApeKey)
);

router.delete(
  "/:apeKeyId",
  authenticateRequest(),
  RateLimit.apeKeysDelete,
  checkIfUserCanManageApeKeys,
  validateRequest({
    params: {
      apeKeyId: joi.string().token().required(),
    },
  }),
  asyncHandler(ApeKeyController.deleteApeKey)
);

export default router;
