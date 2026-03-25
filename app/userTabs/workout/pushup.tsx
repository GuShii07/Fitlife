// import { Ionicons } from "@expo/vector-icons";
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { Alert, Pressable, Text, View } from "react-native";
// import { Camera, useCameraDevice, useCameraPermission } from "react-native-vision-camera";
// import {
//     addPoseErrorListener,
//     addPoseLandmarksListener,
//     addPoseStatusListener,
//     ExpoPoseDetectionModule,
//     type PoseLandmark,
//     type PoseLandmarksDetectedEvent,
// } from "../../../modules/expo-pose-detection"; // ✅ adjust if your import path differs

// const BG = "#0B0F1A";
// const CARD = "#111A2C";
// const BORDER = "#1F2A44";
// const MUTED = "#9AA6BD";
// const ACCENT = "#FF4D2D";

// type Phase = "idle" | "counting" | "paused" | "finished";
// type RepState = "UP" | "DOWN";

// const LM = {
//     L_SHOULDER: 11,
//     R_SHOULDER: 12,
//     L_ELBOW: 13,
//     R_ELBOW: 14,
//     L_WRIST: 15,
//     R_WRIST: 16,
//     L_HIP: 23,
//     R_HIP: 24,
// } as const;

// function getAngle(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark) {
//     // angle at b between ba and bc
//     const abx = a.x - b.x;
//     const aby = a.y - b.y;
//     const cbx = c.x - b.x;
//     const cby = c.y - b.y;

//     const dot = abx * cbx + aby * cby;
//     const mag1 = Math.sqrt(abx * abx + aby * aby);
//     const mag2 = Math.sqrt(cbx * cbx + cby * cby);
//     if (mag1 === 0 || mag2 === 0) return 180;

//     let cos = dot / (mag1 * mag2);
//     cos = Math.max(-1, Math.min(1, cos));
//     const rad = Math.acos(cos);
//     return (rad * 180) / Math.PI;
// }

// function pickPrimaryPerson(event: PoseLandmarksDetectedEvent): PoseLandmark[] | null {
//     // Your type shows landmarks: PoseLandmark[][]
//     const people = (event as any)?.landmarks as PoseLandmark[][] | undefined;
//     if (!people || !people.length) return null;
//     return people[0] || null;
// }

// function safeLm(arr: PoseLandmark[], idx: number) {
//     const p = arr[idx];
//     if (!p) return null;
//     // some implementations include visibility; we’ll accept if coords exist
//     if (typeof p.x !== "number" || typeof p.y !== "number") return null;
//     return p;
// }

// /**
//  * Very simple posture validity checks:
//  * - Must see shoulders + hips
//  * - Shoulders should be above hips (plank-ish) by a minimum margin
//  * If not valid -> we pause/stop counting.
//  */
// function isPushupPostureValid(lms: PoseLandmark[]) {
//     const ls = safeLm(lms, LM.L_SHOULDER);
//     const rs = safeLm(lms, LM.R_SHOULDER);
//     const lh = safeLm(lms, LM.L_HIP);
//     const rh = safeLm(lms, LM.R_HIP);
//     if (!ls || !rs || !lh || !rh) return false;

//     const shoulderY = (ls.y + rs.y) / 2;
//     const hipY = (lh.y + rh.y) / 2;

//     // In normalized coords: y increases downward.
//     // For a push-up posture, shoulders should usually be ABOVE hips (smaller y).
//     const minDelta = 0.03; // tweak if too strict/loose
//     const ok = shoulderY < hipY - minDelta;

//     return ok;
// }

// function averageElbowAngle(lms: PoseLandmark[]) {
//     const ls = safeLm(lms, LM.L_SHOULDER);
//     const le = safeLm(lms, LM.L_ELBOW);
//     const lw = safeLm(lms, LM.L_WRIST);

//     const rs = safeLm(lms, LM.R_SHOULDER);
//     const re = safeLm(lms, LM.R_ELBOW);
//     const rw = safeLm(lms, LM.R_WRIST);

//     const angles: number[] = [];

//     if (ls && le && lw) angles.push(getAngle(ls, le, lw));
//     if (rs && re && rw) angles.push(getAngle(rs, re, rw));

//     if (!angles.length) return null;
//     return angles.reduce((a, b) => a + b, 0) / angles.length;
// }

// /**
//  * Try to start/stop the native detector.
//  * We don’t know your exact native method names, so we probe common names.
//  * If your module has a different method, replace these with the right one.
//  */
// async function startNativeDetector() {
//     const m: any = ExpoPoseDetectionModule as any;

//     const candidates = ["start", "startDetection", "startPoseDetection", "begin", "resume"];
//     for (const name of candidates) {
//         if (typeof m?.[name] === "function") {
//             await m[name]();
//             return { used: name };
//         }
//     }
//     return { used: null as string | null };
// }

// async function stopNativeDetector() {
//     const m: any = ExpoPoseDetectionModule as any;

//     const candidates = ["stop", "stopDetection", "stopPoseDetection", "end", "pause"];
//     for (const name of candidates) {
//         if (typeof m?.[name] === "function") {
//             await m[name]();
//             return { used: name };
//         }
//     }
//     return { used: null as string | null };
// }

// export default function PushupChallenge() {
//     const device = useCameraDevice("front");
//     const { hasPermission, requestPermission } = useCameraPermission();

//     const [phase, setPhase] = useState<Phase>("idle");
//     const [repState, setRepState] = useState<RepState>("UP");
//     const [count, setCount] = useState(0);

//     const [statusText, setStatusText] = useState<string>("Ready");
//     const [debugText, setDebugText] = useState<string>("");

//     const lastLandmarkAt = useRef<number>(0);
//     const invalidFrames = useRef<number>(0);

//     const [startMethodUsed, setStartMethodUsed] = useState<string | null>(null);
//     const [stopMethodUsed, setStopMethodUsed] = useState<string | null>(null);

//     // thresholds (tweak later if needed)
//     const UP_ANGLE = 155;   // arms extended
//     const DOWN_ANGLE = 95;  // bottom position
//     const MAX_MISSING_MS = 1200; // stop if no pose for this long
//     const INVALID_FRAMES_TO_PAUSE = 10; // about ~0.3s at 30fps-ish

//     useEffect(() => {
//         (async () => {
//             if (!hasPermission) await requestPermission();
//         })();
//     }, [hasPermission, requestPermission]);

//     useEffect(() => {
//         // Subscribe to pose events
//         const subLm = addPoseLandmarksListener((event) => {
//             const now = Date.now();
//             lastLandmarkAt.current = now;

//             const person = pickPrimaryPerson(event);
//             if (!person) return;

//             const ok = isPushupPostureValid(person);

//             if (!ok) {
//                 invalidFrames.current += 1;
//             } else {
//                 invalidFrames.current = 0;
//             }

//             const angle = averageElbowAngle(person);

//             // lightweight debug (optional)
//             if (angle != null) {
//                 setDebugText(`Elbow angle: ${Math.round(angle)}°`);
//             }

//             if (phase !== "counting") return;

//             // If posture invalid for too long -> pause/finish
//             if (invalidFrames.current >= INVALID_FRAMES_TO_PAUSE) {
//                 setStatusText("Pose lost / posture changed — paused");
//                 setPhase("paused");
//                 return;
//             }

//             if (angle == null) return;

//             // Rep state machine: UP -> DOWN -> UP counts 1
//             if (repState === "UP") {
//                 if (angle <= DOWN_ANGLE) {
//                     setRepState("DOWN");
//                 }
//             } else {
//                 if (angle >= UP_ANGLE) {
//                     setRepState("UP");
//                     setCount((c) => c + 1);
//                 }
//             }
//         });

//         const subStatus = addPoseStatusListener((e) => {
//             // If your native sends useful status strings, show them
//             const msg = (e as any)?.status ?? (e as any)?.message ?? "Running";
//             setStatusText(String(msg));
//         });

//         const subErr = addPoseErrorListener((e) => {
//             const msg = (e as any)?.message ?? "Pose error";
//             setStatusText(String(msg));
//         });

//         return () => {
//             subLm?.remove();
//             subStatus?.remove();
//             subErr?.remove();
//         };
//     }, [phase, repState]);

//     // Watchdog: if detector stops sending landmarks, pause/finish
//     useEffect(() => {
//         const t = setInterval(() => {
//             if (phase !== "counting") return;
//             const now = Date.now();
//             const age = now - lastLandmarkAt.current;
//             if (lastLandmarkAt.current > 0 && age > MAX_MISSING_MS) {
//                 setStatusText("No pose detected — paused");
//                 setPhase("paused");
//             }
//         }, 300);

//         return () => clearInterval(t);
//     }, [phase]);

//     const canUseCamera = useMemo(() => !!device && hasPermission, [device, hasPermission]);

//     const start = async () => {
//         if (!hasPermission) {
//             const ok = await requestPermission();
//             if (!ok) {
//                 Alert.alert("Camera required", "Allow camera access to start the challenge.");
//                 return;
//             }
//         }

//         setCount(0);
//         setRepState("UP");
//         invalidFrames.current = 0;
//         lastLandmarkAt.current = Date.now();

//         setPhase("counting");
//         setStatusText("Counting…");

//         const { used } = await startNativeDetector();
//         setStartMethodUsed(used);

//         // If no native start method exists, we still run — maybe native starts automatically.
//         // But if your detector actually needs explicit start, you’ll need to rename the method above.
//     };

//     const pause = async () => {
//         setPhase("paused");
//         setStatusText("Paused");
//         const { used } = await stopNativeDetector();
//         setStopMethodUsed(used);
//     };

//     const resume = async () => {
//         setPhase("counting");
//         setStatusText("Counting…");
//         invalidFrames.current = 0;
//         lastLandmarkAt.current = Date.now();

//         const { used } = await startNativeDetector();
//         setStartMethodUsed(used ?? startMethodUsed);
//     };

//     const retry = async () => {
//         await stopNativeDetector();
//         setCount(0);
//         setRepState("UP");
//         setPhase("idle");
//         setStatusText("Ready");
//         setDebugText("");
//         invalidFrames.current = 0;
//         lastLandmarkAt.current = 0;
//     };

//     const save = async () => {
//         // TODO: Save to Supabase (count + user_id + created_at)
//         // Example:
//         // const user = (await supabase.auth.getUser()).data.user;
//         // await supabase.from("pushup_scores").insert({ user_id: user?.id, reps: count });

//         Alert.alert("Saved ✅", `You saved ${count} push-ups!`, [{ text: "OK", onPress: () => retry() }]);
//     };

//     return (
//         <View style={{ flex: 1, backgroundColor: BG }}>
//             {/* Header */}
//             <View style={{ paddingTop: 54, paddingHorizontal: 16, paddingBottom: 12 }}>
//                 <Text style={{ color: "white", fontWeight: "900", fontSize: 22 }}>Push-up Challenge</Text>
//                 <Text style={{ color: MUTED, marginTop: 4 }}>
//                     Camera counts reps automatically. Stand up / lose pose = pauses.
//                 </Text>
//             </View>

//             {/* Camera */}
//             <View style={{ paddingHorizontal: 16 }}>
//                 <View
//                     style={{
//                         height: 420,
//                         borderRadius: 22,
//                         overflow: "hidden",
//                         backgroundColor: CARD,
//                         borderWidth: 1,
//                         borderColor: BORDER,
//                     }}
//                 >
//                     {canUseCamera ? (
//                         <Camera
//                             style={{ flex: 1 }}
//                             device={device!}
//                             isActive={phase === "counting" || phase === "paused" || phase === "idle"}
//                         />
//                     ) : (
//                         <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
//                             <Ionicons name="camera-outline" size={28} color={MUTED} />
//                             <Text style={{ color: MUTED, marginTop: 10, fontWeight: "800" }}>
//                                 {hasPermission ? "Loading camera…" : "Camera permission needed"}
//                             </Text>
//                             {!hasPermission && (
//                                 <Pressable
//                                     onPress={requestPermission}
//                                     style={{
//                                         marginTop: 12,
//                                         height: 44,
//                                         paddingHorizontal: 16,
//                                         borderRadius: 16,
//                                         borderWidth: 1,
//                                         borderColor: "rgba(255,77,45,0.35)",
//                                         backgroundColor: "rgba(255,77,45,0.12)",
//                                         alignItems: "center",
//                                         justifyContent: "center",
//                                     }}
//                                 >
//                                     <Text style={{ color: "#FFD3CA", fontWeight: "900" }}>Allow camera</Text>
//                                 </Pressable>
//                             )}
//                         </View>
//                     )}

//                     {/* Overlay */}
//                     <View
//                         pointerEvents="none"
//                         style={{
//                             position: "absolute",
//                             left: 12,
//                             right: 12,
//                             top: 12,
//                             flexDirection: "row",
//                             justifyContent: "space-between",
//                             alignItems: "center",
//                         }}
//                     >
//                         <View
//                             style={{
//                                 paddingHorizontal: 12,
//                                 height: 34,
//                                 borderRadius: 999,
//                                 backgroundColor: "rgba(0,0,0,0.45)",
//                                 alignItems: "center",
//                                 justifyContent: "center",
//                                 flexDirection: "row",
//                                 gap: 8,
//                             }}
//                         >
//                             <Ionicons name="flash-outline" size={16} color="white" />
//                             <Text style={{ color: "white", fontWeight: "900" }}>{phase.toUpperCase()}</Text>
//                         </View>

//                         <View
//                             style={{
//                                 paddingHorizontal: 12,
//                                 height: 34,
//                                 borderRadius: 999,
//                                 backgroundColor: "rgba(0,0,0,0.45)",
//                                 alignItems: "center",
//                                 justifyContent: "center",
//                             }}
//                         >
//                             <Text style={{ color: "white", fontWeight: "900" }}>Reps: {count}</Text>
//                         </View>
//                     </View>

//                     <View style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
//                         <View
//                             style={{
//                                 borderRadius: 16,
//                                 backgroundColor: "rgba(0,0,0,0.45)",
//                                 padding: 12,
//                             }}
//                         >
//                             <Text style={{ color: "white", fontWeight: "900" }}>{statusText}</Text>
//                             {!!debugText && <Text style={{ color: "#DDE6F6", marginTop: 4 }}>{debugText}</Text>}
//                             {(startMethodUsed || stopMethodUsed) && (
//                                 <Text style={{ color: MUTED, marginTop: 4, fontSize: 12 }}>
//                                     start: {startMethodUsed ?? "auto"} • stop: {stopMethodUsed ?? "auto"}
//                                 </Text>
//                             )}
//                         </View>
//                     </View>
//                 </View>
//             </View>

//             {/* Controls */}
//             <View style={{ padding: 16, gap: 10 }}>
//                 {phase === "idle" && (
//                     <Pressable
//                         onPress={start}
//                         style={{
//                             height: 56,
//                             borderRadius: 999,
//                             backgroundColor: ACCENT,
//                             alignItems: "center",
//                             justifyContent: "center",
//                             flexDirection: "row",
//                             gap: 10,
//                         }}
//                     >
//                         <Ionicons name="play" size={18} color="white" />
//                         <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>Start</Text>
//                     </Pressable>
//                 )}

//                 {phase === "counting" && (
//                     <Pressable
//                         onPress={pause}
//                         style={{
//                             height: 56,
//                             borderRadius: 999,
//                             backgroundColor: "rgba(255,77,45,0.12)",
//                             borderWidth: 1,
//                             borderColor: "rgba(255,77,45,0.35)",
//                             alignItems: "center",
//                             justifyContent: "center",
//                             flexDirection: "row",
//                             gap: 10,
//                         }}
//                     >
//                         <Ionicons name="pause" size={18} color="#FFD3CA" />
//                         <Text style={{ color: "#FFD3CA", fontWeight: "900", fontSize: 16 }}>Pause</Text>
//                     </Pressable>
//                 )}

//                 {phase === "paused" && (
//                     <View style={{ flexDirection: "row", gap: 10 }}>
//                         <Pressable
//                             onPress={resume}
//                             style={{
//                                 flex: 1,
//                                 height: 56,
//                                 borderRadius: 999,
//                                 backgroundColor: ACCENT,
//                                 alignItems: "center",
//                                 justifyContent: "center",
//                                 flexDirection: "row",
//                                 gap: 10,
//                             }}
//                         >
//                             <Ionicons name="play" size={18} color="white" />
//                             <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>Resume</Text>
//                         </Pressable>

//                         <Pressable
//                             onPress={retry}
//                             style={{
//                                 flex: 1,
//                                 height: 56,
//                                 borderRadius: 999,
//                                 backgroundColor: CARD,
//                                 borderWidth: 1,
//                                 borderColor: BORDER,
//                                 alignItems: "center",
//                                 justifyContent: "center",
//                                 flexDirection: "row",
//                                 gap: 10,
//                             }}
//                         >
//                             <Ionicons name="refresh" size={18} color="white" />
//                             <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>Retry</Text>
//                         </Pressable>
//                     </View>
//                 )}

//                 {(phase === "paused" || phase === "counting") && (
//                     <Pressable
//                         onPress={save}
//                         style={{
//                             height: 56,
//                             borderRadius: 999,
//                             backgroundColor: CARD,
//                             borderWidth: 1,
//                             borderColor: BORDER,
//                             alignItems: "center",
//                             justifyContent: "center",
//                             flexDirection: "row",
//                             gap: 10,
//                         }}
//                     >
//                         <Ionicons name="save-outline" size={18} color="white" />
//                         <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>Save result</Text>
//                     </Pressable>
//                 )}

//                 <Text style={{ color: MUTED, fontSize: 12, marginTop: 6 }}>
//                     Tip: keep shoulders above hips (push-up posture). If pose disappears, the app pauses.
//                 </Text>
//             </View>
//         </View>
//     );
// }