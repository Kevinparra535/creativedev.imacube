import type { CameraControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import { subscribe, getCube } from "../scene/systems/Community";

export function FollowCamera({
  selectedId,
  controlsRef,
  locked,
}: {
  selectedId: string | null;
  controlsRef: React.RefObject<CameraControls | null>;
  locked: boolean;
}) {
  const eye = useRef<[number, number, number]>([-10, 5, 10]);
  const target = useRef<[number, number, number] | null>(null);
  const followOffset = useRef<[number, number, number]>([-10, 6, 10]);
  const userInteracting = useRef(false);

  useEffect(() => {
    const update = () => {
      if (!selectedId) {
        target.current = null;
        return;
      }
      const cube = getCube(selectedId);
      if (cube) target.current = cube.position;
    };
    update();
    const unsub = subscribe(update);
    return () => {
      if (unsub) unsub();
    };
  }, [selectedId]);

  // Watch user interactions on controls to allow manual rotation while following
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const onStart = () => {
      userInteracting.current = true;
    };
    const onEnd = () => {
      userInteracting.current = false;
    };
    controls.addEventListener?.("controlstart", onStart);
    controls.addEventListener?.("controlend", onEnd);
    return () => {
      controls.removeEventListener?.("controlstart", onStart);
      controls.removeEventListener?.("controlend", onEnd);
    };
  }, [controlsRef]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (!selectedId || !target.current || !locked) return;

    const [tx, ty, tz] = target.current;

    // If the user is rotating, keep their angle by updating the followOffset to current eye-target
    // and only move the target to the cube position so orbit stays interactive.
    if (userInteracting.current) {
      // Update offset from current camera position
      const pos = controls.camera?.position;
      if (pos) {
        followOffset.current = [pos.x - tx, pos.y - (ty + 0.5), pos.z - tz];
      }
      controls.setTarget(tx, ty + 0.5, tz, false);
      return;
    }

    // Otherwise, smoothly move the eye to maintain the stored offset while following target
    const desiredEye: [number, number, number] = [
      tx + followOffset.current[0],
      ty + 0.5 + followOffset.current[1],
      tz + followOffset.current[2],
    ];
    const k = Math.min(1, delta * 2.5);
    eye.current[0] += (desiredEye[0] - eye.current[0]) * k;
    eye.current[1] += (desiredEye[1] - eye.current[1]) * k;
    eye.current[2] += (desiredEye[2] - eye.current[2]) * k;

    controls.setLookAt(
      eye.current[0],
      eye.current[1],
      eye.current[2],
      tx,
      ty + 0.5,
      tz,
      false
    );
  });

  return null;
}
