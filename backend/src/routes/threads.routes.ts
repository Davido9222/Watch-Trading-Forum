import { Router } from "express";
import { auth } from "./authMiddleware";
import {
  listThreads,
  getThread,
  createThread,
  incrementViewCount,
  updateThreadFlags,
  deleteThread,
  createComment,
  deleteComment,
} from "./threads.controller";

const router = Router();

router.get("/", listThreads);
router.get("/:id", getThread);
router.post("/", auth, createThread);
router.post("/:id/view", incrementViewCount);
router.post("/:id/comments", auth, createComment);
router.delete("/comments/:commentId", auth, deleteComment);
router.patch("/:id", auth, updateThreadFlags);
router.delete("/:id", auth, deleteThread);

export default router;
