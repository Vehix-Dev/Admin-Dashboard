(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/hooks/use-toast.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "reducer",
    ()=>reducer,
    "toast",
    ()=>toast,
    "useToast",
    ()=>useToast
]);
// Inspired by react-hot-toast library
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;
const actionTypes = {
    ADD_TOAST: 'ADD_TOAST',
    UPDATE_TOAST: 'UPDATE_TOAST',
    DISMISS_TOAST: 'DISMISS_TOAST',
    REMOVE_TOAST: 'REMOVE_TOAST'
};
let count = 0;
function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER;
    return count.toString();
}
const toastTimeouts = new Map();
const addToRemoveQueue = (toastId)=>{
    if (toastTimeouts.has(toastId)) {
        return;
    }
    const timeout = setTimeout(()=>{
        toastTimeouts.delete(toastId);
        dispatch({
            type: 'REMOVE_TOAST',
            toastId: toastId
        });
    }, TOAST_REMOVE_DELAY);
    toastTimeouts.set(toastId, timeout);
};
const reducer = (state, action)=>{
    switch(action.type){
        case 'ADD_TOAST':
            return {
                ...state,
                toasts: [
                    action.toast,
                    ...state.toasts
                ].slice(0, TOAST_LIMIT)
            };
        case 'UPDATE_TOAST':
            return {
                ...state,
                toasts: state.toasts.map((t)=>t.id === action.toast.id ? {
                        ...t,
                        ...action.toast
                    } : t)
            };
        case 'DISMISS_TOAST':
            {
                const { toastId } = action;
                if (toastId) {
                    addToRemoveQueue(toastId);
                } else {
                    state.toasts.forEach((toast)=>{
                        addToRemoveQueue(toast.id);
                    });
                }
                return {
                    ...state,
                    toasts: state.toasts.map((t)=>t.id === toastId || toastId === undefined ? {
                            ...t,
                            open: false
                        } : t)
                };
            }
        case 'REMOVE_TOAST':
            if (action.toastId === undefined) {
                return {
                    ...state,
                    toasts: []
                };
            }
            return {
                ...state,
                toasts: state.toasts.filter((t)=>t.id !== action.toastId)
            };
    }
};
const listeners = [];
let memoryState = {
    toasts: []
};
function dispatch(action) {
    memoryState = reducer(memoryState, action);
    listeners.forEach((listener)=>{
        listener(memoryState);
    });
}
function toast({ ...props }) {
    const id = genId();
    const update = (props)=>dispatch({
            type: 'UPDATE_TOAST',
            toast: {
                ...props,
                id
            }
        });
    const dismiss = ()=>dispatch({
            type: 'DISMISS_TOAST',
            toastId: id
        });
    dispatch({
        type: 'ADD_TOAST',
        toast: {
            ...props,
            id,
            open: true,
            onOpenChange: (open)=>{
                if (!open) dismiss();
            }
        }
    });
    return {
        id: id,
        dismiss,
        update
    };
}
function useToast() {
    _s();
    const [state, setState] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](memoryState);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"]({
        "useToast.useEffect": ()=>{
            listeners.push(setState);
            return ({
                "useToast.useEffect": ()=>{
                    const index = listeners.indexOf(setState);
                    if (index > -1) {
                        listeners.splice(index, 1);
                    }
                }
            })["useToast.useEffect"];
        }
    }["useToast.useEffect"], [
        state
    ]);
    return {
        ...state,
        toast,
        dismiss: (toastId)=>dispatch({
                type: 'DISMISS_TOAST',
                toastId
            })
    };
}
_s(useToast, "SPWE98mLGnlsnNfIwu/IAKTSZtk=");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/ui/toast.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Toast",
    ()=>Toast,
    "ToastAction",
    ()=>ToastAction,
    "ToastClose",
    ()=>ToastClose,
    "ToastDescription",
    ()=>ToastDescription,
    "ToastProvider",
    ()=>ToastProvider,
    "ToastTitle",
    ()=>ToastTitle,
    "ToastViewport",
    ()=>ToastViewport
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-toast/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
'use client';
;
;
;
;
;
;
const ToastProvider = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Provider"];
const ToastViewport = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Viewport"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/toast.tsx",
        lineNumber: 16,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c1 = ToastViewport;
ToastViewport.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Viewport"].displayName;
const toastVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])('group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full', {
    variants: {
        variant: {
            default: 'border bg-background text-foreground',
            destructive: 'destructive group border-destructive bg-destructive text-destructive-foreground'
        }
    },
    defaultVariants: {
        variant: 'default'
    }
});
const Toast = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c2 = ({ className, variant, ...props }, ref)=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(toastVariants({
            variant
        }), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/toast.tsx",
        lineNumber: 49,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
_c3 = Toast;
Toast.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"].displayName;
const ToastAction = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c4 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Action"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/toast.tsx",
        lineNumber: 62,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c5 = ToastAction;
ToastAction.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Action"].displayName;
const ToastClose = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c6 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Close"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600', className),
        "toast-close": "",
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
            className: "h-4 w-4"
        }, void 0, false, {
            fileName: "[project]/components/ui/toast.tsx",
            lineNumber: 86,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/ui/toast.tsx",
        lineNumber: 77,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c7 = ToastClose;
ToastClose.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Close"].displayName;
const ToastTitle = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c8 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Title"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-sm font-semibold', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/toast.tsx",
        lineNumber: 95,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c9 = ToastTitle;
ToastTitle.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Title"].displayName;
const ToastDescription = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c10 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Description"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-sm opacity-90', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/toast.tsx",
        lineNumber: 107,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c11 = ToastDescription;
ToastDescription.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Description"].displayName;
;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11;
__turbopack_context__.k.register(_c, "ToastViewport$React.forwardRef");
__turbopack_context__.k.register(_c1, "ToastViewport");
__turbopack_context__.k.register(_c2, "Toast$React.forwardRef");
__turbopack_context__.k.register(_c3, "Toast");
__turbopack_context__.k.register(_c4, "ToastAction$React.forwardRef");
__turbopack_context__.k.register(_c5, "ToastAction");
__turbopack_context__.k.register(_c6, "ToastClose$React.forwardRef");
__turbopack_context__.k.register(_c7, "ToastClose");
__turbopack_context__.k.register(_c8, "ToastTitle$React.forwardRef");
__turbopack_context__.k.register(_c9, "ToastTitle");
__turbopack_context__.k.register(_c10, "ToastDescription$React.forwardRef");
__turbopack_context__.k.register(_c11, "ToastDescription");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/ui/toaster.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Toaster",
    ()=>Toaster
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/hooks/use-toast.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/toast.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function Toaster() {
    _s();
    const { toasts } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ToastProvider"], {
        children: [
            toasts.map(function({ id, title, description, action, ...props }) {
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Toast"], {
                    ...props,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid gap-1",
                            children: [
                                title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ToastTitle"], {
                                    children: title
                                }, void 0, false, {
                                    fileName: "[project]/components/ui/toaster.tsx",
                                    lineNumber: 22,
                                    columnNumber: 25
                                }, this),
                                description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ToastDescription"], {
                                    children: description
                                }, void 0, false, {
                                    fileName: "[project]/components/ui/toaster.tsx",
                                    lineNumber: 24,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/ui/toaster.tsx",
                            lineNumber: 21,
                            columnNumber: 13
                        }, this),
                        action,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ToastClose"], {}, void 0, false, {
                            fileName: "[project]/components/ui/toaster.tsx",
                            lineNumber: 28,
                            columnNumber: 13
                        }, this)
                    ]
                }, id, true, {
                    fileName: "[project]/components/ui/toaster.tsx",
                    lineNumber: 20,
                    columnNumber: 11
                }, this);
            }),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ToastViewport"], {}, void 0, false, {
                fileName: "[project]/components/ui/toaster.tsx",
                lineNumber: 32,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/ui/toaster.tsx",
        lineNumber: 17,
        columnNumber: 5
    }, this);
}
_s(Toaster, "1YTCnXrq2qRowe0H/LBWLjtXoYc=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"]
    ];
});
_c = Toaster;
var _c;
__turbopack_context__.k.register(_c, "Toaster");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/permissions.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Define all  permissions
__turbopack_context__.s([
    "PERMISSIONS",
    ()=>PERMISSIONS,
    "ROLES",
    ()=>ROLES,
    "ROLE_PERMISSIONS",
    ()=>ROLE_PERMISSIONS,
    "getUserRole",
    ()=>getUserRole,
    "hasAllPermissions",
    ()=>hasAllPermissions,
    "hasAnyPermission",
    ()=>hasAnyPermission,
    "hasPermission",
    ()=>hasPermission
]);
const PERMISSIONS = {
    // Admin Users
    ADMIN_USERS_VIEW: 'admin_users.view',
    ADMIN_USERS_ADD: 'admin_users.add',
    ADMIN_USERS_CHANGE: 'admin_users.change',
    ADMIN_USERS_DELETE: 'admin_users.delete',
    ADMIN_USERS_DISABLE: 'admin_users.disable',
    ADMIN_USERS_APPROVE: 'admin_users.approve',
    // Riders
    RIDERS_VIEW: 'riders.view',
    RIDERS_ADD: 'riders.add',
    RIDERS_CHANGE: 'riders.change',
    RIDERS_DELETE: 'riders.delete',
    RIDERS_DISABLE: 'riders.disable',
    RIDERS_APPROVE: 'riders.approve',
    // Roadies
    ROADIES_VIEW: 'roadies.view',
    ROADIES_ADD: 'roadies.add',
    ROADIES_CHANGE: 'roadies.change',
    ROADIES_DELETE: 'roadies.delete',
    ROADIES_DISABLE: 'roadies.disable',
    ROADIES_APPROVE: 'roadies.approve',
    // Services
    SERVICES_VIEW: 'services.view',
    SERVICES_ADD: 'services.add',
    SERVICES_CHANGE: 'services.change',
    SERVICES_DELETE: 'services.delete',
    // Service Requests
    REQUESTS_VIEW: 'requests.view',
    REQUESTS_ADD: 'requests.add',
    REQUESTS_CHANGE: 'requests.change',
    REQUESTS_DELETE: 'requests.delete',
    REQUESTS_ASSIGN: 'requests.assign',
    // Dashboard
    DASHBOARD_VIEW: 'dashboard.view',
    // Live Map
    MAP_VIEW: 'map.view',
    // Moderation
    MEDIA_VIEW: 'media.view',
    MEDIA_MANAGE: 'media.manage',
    // Notifications
    NOTIFICATIONS_VIEW: 'notifications.view',
    NOTIFICATIONS_MANAGE: 'notifications.manage',
    EMAIL_SEND: 'notifications.email_send',
    // Referrals
    REFERRALS_VIEW: 'referrals.view',
    REFERRALS_MANAGE: 'referrals.manage',
    // Reports
    REPORTS_VIEW: 'reports.view',
    // Rodie Services
    RODIE_SERVICES_VIEW: 'rodie_services.view',
    RODIE_SERVICES_DELETE: 'rodie_services.delete',
    // Wallet
    WALLET_VIEW: 'wallet.view',
    WALLET_MANAGE: 'wallet.manage',
    // Support
    SUPPORT_VIEW: 'support.view',
    SUPPORT_MANAGE: 'support.manage',
    // Settings
    SETTINGS_VIEW: 'settings.view',
    SETTINGS_CHANGE: 'settings.change'
};
const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    VIEWER: 'VIEWER',
    OPERATOR: 'OPERATOR'
};
const ROLE_PERMISSIONS = {
    SUPER_ADMIN: Object.values(PERMISSIONS),
    ADMIN: [
        // View everything
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.MAP_VIEW,
        PERMISSIONS.SETTINGS_VIEW,
        // Manage users
        PERMISSIONS.ADMIN_USERS_VIEW,
        PERMISSIONS.ADMIN_USERS_ADD,
        PERMISSIONS.ADMIN_USERS_CHANGE,
        PERMISSIONS.ADMIN_USERS_DELETE,
        PERMISSIONS.ADMIN_USERS_DISABLE,
        PERMISSIONS.ADMIN_USERS_APPROVE,
        // Manage riders
        PERMISSIONS.RIDERS_VIEW,
        PERMISSIONS.RIDERS_ADD,
        PERMISSIONS.RIDERS_CHANGE,
        PERMISSIONS.RIDERS_DELETE,
        PERMISSIONS.RIDERS_DISABLE,
        PERMISSIONS.RIDERS_APPROVE,
        // Manage roadies
        PERMISSIONS.ROADIES_VIEW,
        PERMISSIONS.ROADIES_ADD,
        PERMISSIONS.ROADIES_CHANGE,
        PERMISSIONS.ROADIES_DELETE,
        PERMISSIONS.ROADIES_DISABLE,
        PERMISSIONS.ROADIES_APPROVE,
        // Manage services
        PERMISSIONS.SERVICES_VIEW,
        PERMISSIONS.SERVICES_ADD,
        PERMISSIONS.SERVICES_CHANGE,
        PERMISSIONS.SERVICES_DELETE,
        // Manage requests
        PERMISSIONS.REQUESTS_VIEW,
        PERMISSIONS.REQUESTS_ADD,
        PERMISSIONS.REQUESTS_CHANGE,
        PERMISSIONS.REQUESTS_DELETE,
        PERMISSIONS.REQUESTS_ASSIGN,
        // New Permissions
        PERMISSIONS.MEDIA_VIEW,
        PERMISSIONS.MEDIA_MANAGE,
        PERMISSIONS.NOTIFICATIONS_VIEW,
        PERMISSIONS.NOTIFICATIONS_MANAGE,
        PERMISSIONS.EMAIL_SEND,
        PERMISSIONS.REFERRALS_VIEW,
        PERMISSIONS.REFERRALS_MANAGE,
        PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.RODIE_SERVICES_VIEW,
        PERMISSIONS.RODIE_SERVICES_DELETE,
        PERMISSIONS.WALLET_VIEW,
        PERMISSIONS.WALLET_MANAGE,
        PERMISSIONS.SUPPORT_VIEW,
        PERMISSIONS.SUPPORT_MANAGE
    ],
    MANAGER: [
        // View everything
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.MAP_VIEW,
        // Manage riders (read-only)
        PERMISSIONS.RIDERS_VIEW,
        PERMISSIONS.RIDERS_APPROVE,
        // Manage roadies (read-only)
        PERMISSIONS.ROADIES_VIEW,
        PERMISSIONS.ROADIES_APPROVE,
        // View services
        PERMISSIONS.SERVICES_VIEW,
        // Manage requests
        PERMISSIONS.REQUESTS_VIEW,
        PERMISSIONS.REQUESTS_CHANGE,
        PERMISSIONS.REQUESTS_ASSIGN
    ],
    VIEWER: [
        // View only
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.MAP_VIEW,
        PERMISSIONS.RIDERS_VIEW,
        PERMISSIONS.ROADIES_VIEW,
        PERMISSIONS.SERVICES_VIEW,
        PERMISSIONS.REQUESTS_VIEW
    ],
    OPERATOR: [
        // Operational tasks
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.MAP_VIEW,
        PERMISSIONS.REQUESTS_VIEW,
        PERMISSIONS.REQUESTS_CHANGE,
        PERMISSIONS.REQUESTS_ASSIGN,
        PERMISSIONS.RIDERS_VIEW,
        PERMISSIONS.ROADIES_VIEW
    ]
};
function hasPermission(userRole, permission) {
    if (!userRole) return false;
    return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
}
function hasAnyPermission(userRole, permissions) {
    if (!userRole) return false;
    return permissions.some((permission)=>hasPermission(userRole, permission));
}
function hasAllPermissions(userRole, permissions) {
    if (!userRole) return false;
    return permissions.every((permission)=>hasPermission(userRole, permission));
}
function getUserRole(user) {
    if (!user) return 'VIEWER';
    // 1. Try explicit role field
    if (user.role) {
        const roleStr = String(user.role).toUpperCase();
        if (Object.keys(ROLES).includes(roleStr)) {
            return roleStr;
        }
    }
    // 2. Try inferred roles
    if (user.is_superuser) return 'SUPER_ADMIN';
    // Often 'is_staff' means 'ADMIN' in Django default
    if (user.is_staff) return 'ADMIN';
    // 3. Fallback
    return 'VIEWER';
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "APITelemetry",
    ()=>APITelemetry,
    "IMAGE_TYPES",
    ()=>IMAGE_TYPES,
    "SERVICE_STATUSES",
    ()=>SERVICE_STATUSES,
    "adminBulkUploadForUser",
    ()=>adminBulkUploadForUser,
    "adminLogin",
    ()=>adminLogin,
    "adminRegister",
    ()=>adminRegister,
    "adminUploadForUser",
    ()=>adminUploadForUser,
    "apiMultipartRequest",
    ()=>apiMultipartRequest,
    "apiRequest",
    ()=>apiRequest,
    "assignRoadieByAdmin",
    ()=>assignRoadieByAdmin,
    "bulkUpdateImageStatus",
    ()=>bulkUpdateImageStatus,
    "canChargeRequest",
    ()=>canChargeRequest,
    "canReceiveServices",
    ()=>canReceiveServices,
    "chargeCompletedRequestFees",
    ()=>chargeCompletedRequestFees,
    "checkBackendConnection",
    ()=>checkBackendConnection,
    "clearAccessToken",
    ()=>clearAccessToken,
    "createAdminUser",
    ()=>createAdminUser,
    "createNotification",
    ()=>createNotification,
    "createReferral",
    ()=>createReferral,
    "createRider",
    ()=>createRider,
    "createRoadie",
    ()=>createRoadie,
    "createRodieService",
    ()=>createRodieService,
    "createService",
    ()=>createService,
    "createServiceRequest",
    ()=>createServiceRequest,
    "createWallet",
    ()=>createWallet,
    "deleteAdminUser",
    ()=>deleteAdminUser,
    "deleteNotification",
    ()=>deleteNotification,
    "deleteReferral",
    ()=>deleteReferral,
    "deleteRider",
    ()=>deleteRider,
    "deleteRoadie",
    ()=>deleteRoadie,
    "deleteRodieService",
    ()=>deleteRodieService,
    "deleteService",
    ()=>deleteService,
    "deleteServiceRequest",
    ()=>deleteServiceRequest,
    "deleteUserImage",
    ()=>deleteUserImage,
    "deleteWallet",
    ()=>deleteWallet,
    "depositFunds",
    ()=>depositFunds,
    "downloadUserImages",
    ()=>downloadUserImages,
    "fetchLocalPermissions",
    ()=>fetchLocalPermissions,
    "formatFileSize",
    ()=>formatFileSize,
    "getAccessToken",
    ()=>getAccessToken,
    "getActiveRiderLocations",
    ()=>getActiveRiderLocations,
    "getActiveRiders",
    ()=>getActiveRiders,
    "getAdminImageById",
    ()=>getAdminImageById,
    "getAdminUserById",
    ()=>getAdminUserById,
    "getAdminUsers",
    ()=>getAdminUsers,
    "getAllImages",
    ()=>getAllImages,
    "getAllThumbnails",
    ()=>getAllThumbnails,
    "getCombinedMapData",
    ()=>getCombinedMapData,
    "getCombinedRealtimeLocations",
    ()=>getCombinedRealtimeLocations,
    "getCurrentAdminUser",
    ()=>getCurrentAdminUser,
    "getDeletedAdminUsers",
    ()=>getDeletedAdminUsers,
    "getDeletedRiders",
    ()=>getDeletedRiders,
    "getDeletedRoadies",
    ()=>getDeletedRoadies,
    "getFileStructure",
    ()=>getFileStructure,
    "getImageDimensions",
    ()=>getImageDimensions,
    "getImageTypeLabel",
    ()=>getImageTypeLabel,
    "getImagesByUser",
    ()=>getImagesByUser,
    "getMapData",
    ()=>getMapData,
    "getMe",
    ()=>getMe,
    "getMyWallet",
    ()=>getMyWallet,
    "getNotifications",
    ()=>getNotifications,
    "getPlatformConfig",
    ()=>getPlatformConfig,
    "getReferralById",
    ()=>getReferralById,
    "getReferrals",
    ()=>getReferrals,
    "getRequestRoute",
    ()=>getRequestRoute,
    "getRiderActiveRequests",
    ()=>getRiderActiveRequests,
    "getRiderById",
    ()=>getRiderById,
    "getRiderCompletionRate",
    ()=>getRiderCompletionRate,
    "getRiderStatusBreakdown",
    ()=>getRiderStatusBreakdown,
    "getRiderTotalRequests",
    ()=>getRiderTotalRequests,
    "getRiders",
    ()=>getRiders,
    "getRoadieActiveAssignments",
    ()=>getRoadieActiveAssignments,
    "getRoadieById",
    ()=>getRoadieById,
    "getRoadieCompletionRate",
    ()=>getRoadieCompletionRate,
    "getRoadieServices",
    ()=>getRoadieServices,
    "getRoadieStatusBreakdown",
    ()=>getRoadieStatusBreakdown,
    "getRoadieTotalAssignments",
    ()=>getRoadieTotalAssignments,
    "getRoadieUniqueRidersServed",
    ()=>getRoadieUniqueRidersServed,
    "getRoadies",
    ()=>getRoadies,
    "getRodieServiceById",
    ()=>getRodieServiceById,
    "getRodieServices",
    ()=>getRodieServices,
    "getServiceById",
    ()=>getServiceById,
    "getServiceCode",
    ()=>getServiceCode,
    "getServiceName",
    ()=>getServiceName,
    "getServiceRequestById",
    ()=>getServiceRequestById,
    "getServiceRequests",
    ()=>getServiceRequests,
    "getServices",
    ()=>getServices,
    "getStatusColor",
    ()=>getStatusColor,
    "getStatusColorForImage",
    ()=>getStatusColorForImage,
    "getStatusLabel",
    ()=>getStatusLabel,
    "getStatusLabelForImage",
    ()=>getStatusLabelForImage,
    "getUserExternalId",
    ()=>getUserExternalId,
    "getUserImageById",
    ()=>getUserImageById,
    "getUserImages",
    ()=>getUserImages,
    "getUserImagesByType",
    ()=>getUserImagesByType,
    "getUserNotifications",
    ()=>getUserNotifications,
    "getUserReferralCode",
    ()=>getUserReferralCode,
    "getUserReferrals",
    ()=>getUserReferrals,
    "getUserServices",
    ()=>getUserServices,
    "getUserThumbnails",
    ()=>getUserThumbnails,
    "getUserTypeLabel",
    ()=>getUserTypeLabel,
    "getWalletBalance",
    ()=>getWalletBalance,
    "getWalletById",
    ()=>getWalletById,
    "getWallets",
    ()=>getWallets,
    "isPaymentComplete",
    ()=>isPaymentComplete,
    "isServiceActive",
    ()=>isServiceActive,
    "isUserApproved",
    ()=>isUserApproved,
    "isValidNIN",
    ()=>isValidNIN,
    "login",
    ()=>login,
    "refreshToken",
    ()=>refreshToken,
    "register",
    ()=>register,
    "replaceImage",
    ()=>replaceImage,
    "resetAdminUserPassword",
    ()=>resetAdminUserPassword,
    "restoreAdminUser",
    ()=>restoreAdminUser,
    "restoreRider",
    ()=>restoreRider,
    "restoreRoadie",
    ()=>restoreRoadie,
    "saveLocalPermissions",
    ()=>saveLocalPermissions,
    "setAccessToken",
    ()=>setAccessToken,
    "updateAdminUser",
    ()=>updateAdminUser,
    "updateImageStatus",
    ()=>updateImageStatus,
    "updatePlatformConfig",
    ()=>updatePlatformConfig,
    "updateReferral",
    ()=>updateReferral,
    "updateRider",
    ()=>updateRider,
    "updateRoadie",
    ()=>updateRoadie,
    "updateRoadieServices",
    ()=>updateRoadieServices,
    "updateRoadieStatus",
    ()=>updateRoadieStatus,
    "updateRodieService",
    ()=>updateRodieService,
    "updateService",
    ()=>updateService,
    "updateServiceRequest",
    ()=>updateServiceRequest,
    "updateUserImageStatus",
    ()=>updateUserImageStatus,
    "updateUserNotification",
    ()=>updateUserNotification,
    "updateWallet",
    ()=>updateWallet,
    "uploadUserImage",
    ()=>uploadUserImage,
    "withdrawFunds",
    ()=>withdrawFunds
]);
const API_BASE_URL = "http://127.0.0.1:8000";
let authToken = null;
function setAccessToken(token) {
    authToken = token;
    if ("TURBOPACK compile-time truthy", 1) {
        localStorage.setItem("admin_access_token", token);
    }
}
function clearAccessToken() {
    authToken = null;
    if ("TURBOPACK compile-time truthy", 1) {
        localStorage.removeItem("admin_access_token");
        localStorage.removeItem("admin_refresh_token");
    }
}
const APITelemetry = {
    metrics: [],
    log: (metric)=>{
        APITelemetry.metrics.unshift(metric);
        if (APITelemetry.metrics.length > 50) APITelemetry.metrics.pop();
    }
};
function getAccessToken() {
    if (authToken) return authToken;
    if ("TURBOPACK compile-time truthy", 1) {
        return localStorage.getItem("admin_access_token");
    }
    //TURBOPACK unreachable
    ;
}
function getRefreshToken() {
    if ("TURBOPACK compile-time truthy", 1) {
        return localStorage.getItem("admin_refresh_token");
    }
    //TURBOPACK unreachable
    ;
}
async function apiRequest(endpoint, options) {
    try {
        const headers = {
            "Content-Type": "application/json",
            ...options?.headers
        };
        const token = getAccessToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        const startTime = performance.now();
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });
        const duration = performance.now() - startTime;
        // Log telemetry
        APITelemetry.log({
            endpoint,
            method: options?.method || "GET",
            status: response.status,
            duration,
            timestamp: new Date().toISOString()
        });
        if (!response.ok) {
            const errorText = await response.text();
            // Handle the specific "Another device logged in" error
            if (errorText.includes("This session is no longer valid. Another device has logged in.")) {
                console.warn("Session invalidated: Another device logged in.");
                if ("TURBOPACK compile-time truthy", 1) {
                    // We'll use logoutAdmin from auth.ts if possible, but api.ts is a low-level lib
                    // For now, clear tokens and redirect manually to avoid circular dependencies
                    localStorage.removeItem("admin_access_token");
                    localStorage.removeItem("admin_refresh_token");
                    localStorage.removeItem("admin_user_data");
                    window.location.href = "/login?message=session_invalid";
                }
            }
            throw new Error(`API Error (${response.status}): ${errorText}`);
        }
        return response.json();
    } catch (error) {
        console.error(`API request failed: ${endpoint}`, error);
        throw error;
    }
}
async function apiMultipartRequest(endpoint, formData, method = 'POST') {
    try {
        const headers = {};
        const token = getAccessToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers,
            body: formData
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error (${response.status}): ${errorText}`);
        }
        return response.json();
    } catch (error) {
        console.error(`API multipart request failed: ${endpoint}`, error);
        throw error;
    }
}
async function adminLogin(username, password) {
    const response = await apiRequest("/api/auth/admin/login/", {
        method: "POST",
        body: JSON.stringify({
            username,
            password
        })
    });
    setAccessToken(response.access);
    if ("TURBOPACK compile-time truthy", 1) {
        localStorage.setItem("admin_refresh_token", response.refresh);
        localStorage.setItem("admin_user", JSON.stringify(response.user));
    }
    return response;
}
async function adminRegister(data) {
    return apiRequest("/api/auth/admin/register/", {
        method: "POST",
        body: JSON.stringify(data)
    });
}
async function getAdminUsers() {
    return apiRequest("/api/auth/admin/users/");
}
async function getAdminUserById(id) {
    return apiRequest(`/api/auth/admin/users/${id}/`);
}
async function createAdminUser(data) {
    return apiRequest("/api/auth/admin/users/", {
        method: "POST",
        body: JSON.stringify(data)
    });
}
async function updateAdminUser(id, data) {
    return apiRequest(`/api/auth/admin/users/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });
}
async function deleteAdminUser(id) {
    await apiRequest(`/api/auth/admin/users/${id}/`, {
        method: "DELETE"
    });
}
async function resetAdminUserPassword(id, password) {
    return apiRequest(`/api/auth/admin/users/${id}/password/`, {
        method: "POST",
        body: JSON.stringify({
            password
        })
    });
}
async function getDeletedAdminUsers() {
    return apiRequest("/api/auth/admin/users/deleted/");
}
async function restoreAdminUser(id) {
    return apiRequest(`/api/auth/admin/users/${id}/restore/`, {
        method: "POST"
    });
}
async function getUserImages() {
    return apiRequest("/api/images/user-images/");
}
async function getUserImageById(id) {
    return apiRequest(`/api/images/user-images/${id}/`);
}
async function uploadUserImage(imageFile, imageType, description) {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('image_type', imageType);
    if (description) {
        formData.append('description', description);
    }
    return apiMultipartRequest("/api/images/user-images/", formData);
}
async function updateUserImageStatus(id, status) {
    return apiRequest(`/api/images/user-images/${id}/update-status/`, {
        method: "POST",
        body: JSON.stringify({
            status
        })
    });
}
async function deleteUserImage(id) {
    await apiRequest(`/api/images/user-images/${id}/`, {
        method: "DELETE"
    });
}
async function getUserImagesByType(imageType) {
    return apiRequest(`/api/images/user-images/by-type/?type=${imageType}`);
}
async function getUserThumbnails() {
    return apiRequest(`/api/images/user-images/thumbnails/`);
}
async function getAllImages(params) {
    const queryParams = new URLSearchParams();
    if (params?.external_id) queryParams.append('external_id', params.external_id);
    if (params?.image_type) queryParams.append('image_type', params.image_type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.prefix) queryParams.append('prefix', params.prefix);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.ordering) queryParams.append('ordering', params.ordering);
    const url = `/api/images/admin-images/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiRequest(url);
}
async function getAdminImageById(id) {
    return apiRequest(`/api/images/admin-images/${id}/`);
}
async function adminUploadForUser(imageFile, externalId, imageType, description, autoApprove = false) {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('external_id', externalId);
    formData.append('image_type', imageType);
    if (description) {
        formData.append('description', description);
    }
    formData.append('auto_approve', autoApprove.toString());
    return apiMultipartRequest("/api/images/admin-upload/", formData);
}
async function adminBulkUploadForUser(imageFiles, externalId, imageType, description, autoApprove = false) {
    const formData = new FormData();
    imageFiles.forEach((file, index)=>{
        formData.append('images', file);
    });
    formData.append('external_id', externalId);
    formData.append('image_type', imageType);
    if (description) {
        formData.append('description', description);
    }
    formData.append('auto_approve', autoApprove.toString());
    return apiMultipartRequest("/api/images/bulk-upload/", formData);
}
async function getAllThumbnails(params) {
    const queryParams = new URLSearchParams();
    if (params?.external_id) queryParams.append('external_id', params.external_id);
    if (params?.prefix) queryParams.append('prefix', params.prefix);
    if (params?.image_type) queryParams.append('image_type', params.image_type);
    const url = `/api/images/thumbnails/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    try {
        const response = await fetch(`${API_BASE_URL}${url}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error (${response.status}): ${errorText}`);
        }
        return response.json();
    } catch (error) {
        console.error(`API request failed: ${url}`, error);
        throw error;
    }
}
async function getImagesByUser(externalId, params) {
    const queryParams = new URLSearchParams();
    queryParams.append('external_id', externalId);
    if (params?.image_type) queryParams.append('image_type', params.image_type);
    if (params?.status) queryParams.append('status', params.status);
    const url = `/api/images/user-images-by-id/?${queryParams.toString()}`;
    try {
        const response = await fetch(`${API_BASE_URL}${url}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error (${response.status}): ${errorText}`);
        }
        return response.json();
    } catch (error) {
        console.error(`API request failed: ${url}`, error);
        throw error;
    }
}
async function updateImageStatus(id, status) {
    return apiRequest(`/api/images/admin-images/${id}/update-status/`, {
        method: "POST",
        body: JSON.stringify({
            status
        })
    });
}
async function bulkUpdateImageStatus(imageIds, status) {
    return apiRequest("/api/images/admin-images/bulk-update-status/", {
        method: "POST",
        body: JSON.stringify({
            image_ids: imageIds,
            status
        })
    });
}
async function replaceImage(imageId, newImageFile) {
    const formData = new FormData();
    formData.append('image', newImageFile);
    return apiMultipartRequest(`/api/images/admin-images/${imageId}/replace/`, formData, 'POST');
}
async function downloadUserImages(externalId) {
    const token = getAccessToken();
    const headers = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}/api/images/download-images/?external_id=${externalId}`, {
        headers
    });
    if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
    }
    return response.blob();
}
async function getFileStructure() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/images/file-structure/`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error (${response.status}): ${errorText}`);
        }
        return response.json();
    } catch (error) {
        console.error(`API request failed: /api/images/file-structure/`, error);
        throw error;
    }
}
const IMAGE_TYPES = {
    PROFILE: 'PROFILE',
    NIN_FRONT: 'NIN_FRONT',
    NIN_BACK: 'NIN_BACK',
    LICENSE: 'LICENSE',
    VEHICLE: 'VEHICLE',
    OTHER: 'OTHER'
};
function getImageTypeLabel(imageType) {
    switch(imageType){
        case IMAGE_TYPES.PROFILE:
            return 'Profile Picture';
        case IMAGE_TYPES.NIN_FRONT:
            return 'NIN Front';
        case IMAGE_TYPES.NIN_BACK:
            return 'NIN Back';
        case IMAGE_TYPES.LICENSE:
            return 'License';
        case IMAGE_TYPES.VEHICLE:
            return 'Vehicle';
        case IMAGE_TYPES.OTHER:
            return 'Other';
        default:
            return imageType;
    }
}
function getStatusColorForImage(status) {
    switch(status){
        case 'APPROVED':
            return 'green';
        case 'PENDING':
            return 'orange';
        case 'REJECTED':
            return 'red';
        default:
            return 'gray';
    }
}
function getStatusLabelForImage(status) {
    switch(status){
        case 'APPROVED':
            return 'Approved';
        case 'PENDING':
            return 'Pending';
        case 'REJECTED':
            return 'Rejected';
        default:
            return status;
    }
}
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = [
        'Bytes',
        'KB',
        'MB',
        'GB'
    ];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
function getImageDimensions(image) {
    if (image.width && image.height) {
        return `${image.width} × ${image.height}`;
    }
    return 'Unknown';
}
async function getWallets() {
    return apiRequest("/api/auth/admin/wallets/");
}
async function getWalletById(id) {
    return apiRequest(`/api/auth/admin/wallets/${id}/`);
}
async function createWallet(data) {
    return apiRequest("/api/auth/admin/wallets/", {
        method: "POST",
        body: JSON.stringify(data)
    });
}
async function updateWallet(id, data) {
    return apiRequest(`/api/auth/admin/wallets/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });
}
async function deleteWallet(id) {
    await apiRequest(`/api/auth/admin/wallets/${id}/`, {
        method: "DELETE"
    });
}
async function getReferrals() {
    return apiRequest("/api/auth/admin/referrals/");
}
async function getReferralById(id) {
    return apiRequest(`/api/auth/admin/referrals/${id}/`);
}
async function createReferral(data) {
    return apiRequest("/api/auth/admin/referrals/", {
        method: "POST",
        body: JSON.stringify(data)
    });
}
async function updateReferral(id, data) {
    return apiRequest(`/api/auth/admin/referrals/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });
}
async function deleteReferral(id) {
    await apiRequest(`/api/auth/admin/referrals/${id}/`, {
        method: "DELETE"
    });
}
async function getUserReferrals() {
    return apiRequest("/api/referrals/");
}
async function getPlatformConfig() {
    return apiRequest("/api/auth/admin/platform/config/");
}
async function updatePlatformConfig(data) {
    return apiRequest("/api/auth/admin/platform/config/", {
        method: "POST",
        body: JSON.stringify(data)
    });
}
async function register(data) {
    return apiRequest("/api/register/", {
        method: "POST",
        body: JSON.stringify(data)
    });
}
async function login(data) {
    const response = await apiRequest("/api/login/", {
        method: "POST",
        body: JSON.stringify(data)
    });
    if (response.access) setAccessToken(response.access);
    return response;
}
async function getMe() {
    return apiRequest("/api/me/");
}
async function getMyWallet() {
    return apiRequest("/api/wallet/");
}
async function depositFunds(amount, phoneNumber) {
    return apiRequest("/api/wallet/deposit/", {
        method: "POST",
        body: JSON.stringify({
            amount,
            phone_number: phoneNumber
        })
    });
}
async function withdrawFunds(amount, phoneNumber) {
    return apiRequest("/api/wallet/withdraw/", {
        method: "POST",
        body: JSON.stringify({
            amount,
            phone_number: phoneNumber
        })
    });
}
async function getUserNotifications() {
    return apiRequest("/api/notifications/");
}
async function updateUserNotification(id, data) {
    return apiRequest(`/api/notifications/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });
}
async function updateRoadieStatus(isOnline) {
    return apiRequest("/api/roadie/status/", {
        method: "POST",
        body: JSON.stringify({
            is_online: isOnline
        })
    });
}
async function getRiders() {
    return apiRequest("/api/auth/admin/riders/");
}
async function getRiderById(id) {
    return apiRequest(`/api/auth/admin/riders/${id}/`);
}
async function createRider(data) {
    return apiRequest("/api/auth/admin/riders/", {
        method: "POST",
        body: JSON.stringify(data)
    });
}
async function updateRider(id, data) {
    return apiRequest(`/api/auth/admin/riders/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });
}
async function deleteRider(id) {
    await apiRequest(`/api/auth/admin/riders/${id}/`, {
        method: "DELETE"
    });
}
async function getDeletedRiders() {
    const allDeleted = await getDeletedAdminUsers();
    return allDeleted.filter((u)=>u.role === 'RIDER');
}
async function restoreRider(id) {
    return restoreAdminUser(id);
}
async function getActiveRiders(search) {
    const params = new URLSearchParams();
    if (search) params.append("q", search);
    return apiRequest(`/api/auth/admin/riders/realtime/?${params.toString()}`);
}
async function getRoadies() {
    return apiRequest("/api/auth/admin/roadies/");
}
async function getRoadieById(id) {
    return apiRequest(`/api/auth/admin/roadies/${id}/`);
}
async function createRoadie(data) {
    return apiRequest("/api/auth/admin/roadies/", {
        method: "POST",
        body: JSON.stringify(data)
    });
}
async function updateRoadie(id, data) {
    return apiRequest(`/api/auth/admin/roadies/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });
}
async function deleteRoadie(id) {
    await apiRequest(`/api/auth/admin/roadies/${id}/`, {
        method: "DELETE"
    });
    await apiRequest(`/api/auth/admin/roadies/${id}/`, {
        method: "DELETE"
    });
}
async function getDeletedRoadies() {
    const allDeleted = await getDeletedAdminUsers();
    return allDeleted.filter((u)=>u.role === 'ROADIE' || u.role === 'RODIE');
}
async function restoreRoadie(id) {
    return restoreAdminUser(id);
}
async function getServices() {
    return apiRequest("/api/auth/admin/services/");
}
async function getServiceById(id) {
    return apiRequest(`/api/auth/admin/services/${id}/`);
}
async function createService(data) {
    return apiRequest("/api/auth/admin/services/", {
        method: "POST",
        body: JSON.stringify(data)
    });
}
async function updateService(id, data) {
    return apiRequest(`/api/auth/admin/services/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });
}
async function deleteService(id) {
    await apiRequest(`/api/auth/admin/services/${id}/`, {
        method: "DELETE"
    });
}
async function getRodieServices() {
    return apiRequest("/api/auth/admin/rodie-services/");
}
async function getRodieServiceById(id) {
    return apiRequest(`/api/auth/admin/rodie-services/${id}/`);
}
async function createRodieService(data) {
    return apiRequest("/api/auth/admin/rodie-services/", {
        method: "POST",
        body: JSON.stringify(data)
    });
}
async function updateRodieService(id, data) {
    return apiRequest(`/api/auth/admin/rodie-services/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });
}
async function deleteRodieService(id) {
    await apiRequest(`/api/auth/admin/rodie-services/${id}/`, {
        method: "DELETE"
    });
}
async function getRoadieServices() {
    return apiRequest("/api/auth/rodie/services/");
}
async function updateRoadieServices(serviceIds) {
    return apiRequest("/api/auth/rodie/services/", {
        method: "POST",
        body: JSON.stringify({
            service_ids: serviceIds
        })
    });
}
async function getServiceRequests() {
    return apiRequest("/api/auth/admin/requests/");
}
async function getServiceRequestById(id) {
    return apiRequest(`/api/auth/admin/requests/${id}/`);
}
async function createServiceRequest(data) {
    const requestData = {
        ...data
    };
    if (data.rider_lat !== undefined) requestData.rider_lat = String(data.rider_lat);
    if (data.rider_lng !== undefined) requestData.rider_lng = String(data.rider_lng);
    return apiRequest("/api/auth/admin/requests/", {
        method: "POST",
        body: JSON.stringify(requestData)
    });
}
async function updateServiceRequest(id, data) {
    const requestData = {
        ...data
    };
    if (data.rider_lat !== undefined) requestData.rider_lat = String(data.rider_lat);
    if (data.rider_lng !== undefined) requestData.rider_lng = String(data.rider_lng);
    return apiRequest(`/api/auth/admin/requests/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(requestData)
    });
}
async function deleteServiceRequest(id) {
    await apiRequest(`/api/auth/admin/requests/${id}/`, {
        method: "DELETE"
    });
}
async function assignRoadieByAdmin(id, rodieId) {
    return apiRequest(`/api/auth/admin/requests/${id}/assign/`, {
        method: "POST",
        body: JSON.stringify({
            rodie_id: rodieId
        })
    });
}
async function chargeCompletedRequestFees(requestIds) {
    return apiRequest("/api/auth/admin/requests/charge-fees/", {
        method: "POST",
        body: JSON.stringify({
            request_ids: requestIds
        })
    });
}
async function getActiveRiderLocations() {
    return apiRequest("/api/auth/admin/requests/realtime/");
}
async function getMapData() {
    return apiRequest("/api/auth/admin/requests/realtime/map/");
}
async function getCombinedRealtimeLocations() {
    return apiRequest("/api/auth/admin/locations/realtime/");
}
async function getCombinedMapData() {
    return apiRequest("/api/auth/admin/locations/realtime/map/");
}
async function getNotifications() {
    return apiRequest("/api/auth/admin/notifications/");
}
async function createNotification(data) {
    return apiRequest("/api/auth/admin/notifications/", {
        method: "POST",
        body: JSON.stringify(data)
    });
}
async function deleteNotification(id) {
    await apiRequest(`/api/auth/admin/notifications/${id}/`, {
        method: "DELETE"
    });
}
async function getRequestRoute(id) {
    return apiRequest(`/api/auth/admin/requests/${id}/route/`);
}
async function refreshToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        throw new Error("No refresh token available");
    }
    return apiRequest("/api/refresh/", {
        method: "POST",
        body: JSON.stringify({
            refresh: refreshToken
        })
    });
}
async function checkBackendConnection() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(()=>controller.abort(), 3000);
        const response = await fetch(`${API_BASE_URL}/api/auth/admin/login/`, {
            method: 'OPTIONS',
            signal: controller.signal,
            cache: 'no-cache',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        clearTimeout(timeoutId);
        if (response.status === 200 || response.status === 405) {
            return {
                connected: true
            };
        }
        return {
            connected: false,
            error: `Server responded with unexpected status: ${response.status}`
        };
    } catch (error) {
        let errorMessage = "Unknown connection error";
        if (error?.name === 'AbortError') {
            errorMessage = "Connection timeout - server is not responding";
        } else if (error?.message?.includes('Failed to fetch')) {
            errorMessage = "Cannot connect to server. Please ensure the Django backend is running.";
        } else {
            errorMessage = error?.message || "Connection failed";
        }
        return {
            connected: false,
            error: errorMessage
        };
    }
}
async function fetchLocalPermissions(userId) {
    try {
        const response = await fetch(`/api/permissions?userId=${userId}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.permissions;
    } catch (error) {
        console.error("Failed to fetch local permissions:", error);
        return null;
    }
}
async function saveLocalPermissions(userId, permissions) {
    await fetch('/api/permissions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId: String(userId),
            permissions
        })
    });
}
function getCurrentAdminUser() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const stored = localStorage.getItem("admin_user");
    if (!stored) return null;
    try {
        return JSON.parse(stored);
    } catch  {
        return null;
    }
}
function getServiceName(serviceRequest) {
    return serviceRequest.service_type_name || serviceRequest.service_type_details?.name || `Service ${serviceRequest.service_type}`;
}
function getServiceCode(serviceRequest) {
    return serviceRequest.service_type_details?.code || serviceRequest.service_type_name || `SVC${serviceRequest.service_type}`;
}
function isServiceActive(serviceRequest) {
    return serviceRequest.service_type_details?.is_active ?? true;
}
const SERVICE_STATUSES = {
    REQUESTED: 'REQUESTED',
    ACCEPTED: 'ACCEPTED',
    EN_ROUTE: 'EN_ROUTE',
    STARTED: 'STARTED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED'
};
function getStatusColor(status) {
    switch(status){
        case SERVICE_STATUSES.REQUESTED:
            return 'blue';
        case SERVICE_STATUSES.ACCEPTED:
            return 'orange';
        case SERVICE_STATUSES.EN_ROUTE:
            return 'purple';
        case SERVICE_STATUSES.STARTED:
            return 'green';
        case SERVICE_STATUSES.COMPLETED:
            return 'teal';
        case SERVICE_STATUSES.CANCELLED:
            return 'red';
        case SERVICE_STATUSES.EXPIRED:
            return 'gray';
        default:
            return 'gray';
    }
}
function getStatusLabel(status) {
    switch(status){
        case SERVICE_STATUSES.REQUESTED:
            return 'Requested';
        case SERVICE_STATUSES.ACCEPTED:
            return 'Accepted';
        case SERVICE_STATUSES.EN_ROUTE:
            return 'En Route';
        case SERVICE_STATUSES.STARTED:
            return 'Started';
        case SERVICE_STATUSES.COMPLETED:
            return 'Completed';
        case SERVICE_STATUSES.CANCELLED:
            return 'Cancelled';
        case SERVICE_STATUSES.EXPIRED:
            return 'Expired';
        default:
            return status;
    }
}
function getRiderCompletionRate(rider) {
    return rider.summary?.stats.completion_rate || 0;
}
function getRiderTotalRequests(rider) {
    return rider.summary?.stats.total_requests || 0;
}
function getRiderActiveRequests(rider) {
    return rider.summary?.stats.active_requests || 0;
}
function getRoadieCompletionRate(roadie) {
    return roadie.summary?.stats.completion_rate || 0;
}
function getRoadieTotalAssignments(roadie) {
    return roadie.summary?.stats.total_assignments || 0;
}
function getRoadieActiveAssignments(roadie) {
    return roadie.summary?.stats.active_assignments || 0;
}
function getRoadieUniqueRidersServed(roadie) {
    return roadie.summary?.stats.unique_riders_served || 0;
}
function getRiderStatusBreakdown(rider) {
    return rider.summary?.stats.status_breakdown || {};
}
function getRoadieStatusBreakdown(roadie) {
    return roadie.summary?.stats.status_breakdown || {};
}
function getWalletBalance(user) {
    return user.wallet?.balance || "0.00";
}
function canReceiveServices(user, platformConfig) {
    if (!platformConfig) return true // default to true if no config
    ;
    const balance = parseFloat(getWalletBalance(user));
    const maxNegative = parseFloat(platformConfig.max_negative_balance);
    return balance >= -maxNegative;
}
function canChargeRequest(request) {
    return request.status === SERVICE_STATUSES.COMPLETED && !request.fee_charged;
}
function isPaymentComplete(request) {
    return request.is_paid === true;
}
function getUserServices(user) {
    return user.services || [];
}
function isUserApproved(user) {
    return user.is_approved === true;
}
function getUserTypeLabel(user) {
    return user.role === 'RIDER' ? 'Rider' : 'Roadie';
}
function getUserExternalId(user) {
    return user.external_id || `USER${user.id}`;
}
function getUserReferralCode(user) {
    return user.referral_code || '';
}
function isValidNIN(nin) {
    return /^[A-Za-z0-9]{14}$/.test(nin);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/auth.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "authApiRequest",
    ()=>authApiRequest,
    "checkBackendConnection",
    ()=>checkBackendConnection,
    "getAdminProfile",
    ()=>getAdminProfile,
    "getApiBaseUrl",
    ()=>getApiBaseUrl,
    "getAuthToken",
    ()=>getAuthToken,
    "getRefreshToken",
    ()=>getRefreshToken,
    "isAuthenticated",
    ()=>isAuthenticated,
    "loginAdmin",
    ()=>loginAdmin,
    "logoutAdmin",
    ()=>logoutAdmin,
    "refreshAccessToken",
    ()=>refreshAccessToken,
    "removeAuthTokens",
    ()=>removeAuthTokens,
    "setAuthToken",
    ()=>setAuthToken,
    "setRefreshToken",
    ()=>setRefreshToken,
    "testEndpoint",
    ()=>testEndpoint
]);
const API_BASE_URL = "http://127.0.0.1:8000";
function setAuthToken(token) {
    if ("TURBOPACK compile-time truthy", 1) {
        localStorage.setItem("admin_access_token", token);
    }
}
function setRefreshToken(token) {
    if ("TURBOPACK compile-time truthy", 1) {
        localStorage.setItem("admin_refresh_token", token);
    }
}
function getAuthToken() {
    if ("TURBOPACK compile-time truthy", 1) {
        return localStorage.getItem("admin_access_token");
    }
    //TURBOPACK unreachable
    ;
}
function getRefreshToken() {
    if ("TURBOPACK compile-time truthy", 1) {
        return localStorage.getItem("admin_refresh_token");
    }
    //TURBOPACK unreachable
    ;
}
function removeAuthTokens() {
    if ("TURBOPACK compile-time truthy", 1) {
        localStorage.removeItem("admin_access_token");
        localStorage.removeItem("admin_refresh_token");
    }
}
async function checkBackendConnection() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(()=>controller.abort(), 3000);
        const response = await fetch(`${API_BASE_URL}/api/auth/admin/login/`, {
            method: 'OPTIONS',
            signal: controller.signal,
            cache: 'no-cache',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        clearTimeout(timeoutId);
        if (response.status === 200 || response.status === 405) {
            return {
                connected: true
            };
        }
        return {
            connected: false,
            error: `Server responded with status: ${response.status}`
        };
    } catch (error) {
        let errorMessage = "Unknown connection error";
        if (error.name === 'AbortError') {
            errorMessage = "Connection timeout - server is not responding";
        } else if (error.message?.includes('Failed to fetch')) {
            errorMessage = "Cannot connect to server. Please ensure the Django backend is running.";
        } else {
            errorMessage = error.message || "Connection failed";
        }
        return {
            connected: false,
            error: errorMessage
        };
    }
}
async function loginAdmin(username, password) {
    const controller = new AbortController();
    const timeoutId = setTimeout(()=>controller.abort(), 10000);
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/admin/login/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                password
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            let errorMessage = `Login failed: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData.detail) {
                    errorMessage = errorData.detail;
                }
            } catch  {
            // If response is not JSON, use default error message
            }
            throw new Error(errorMessage);
        }
        const data = await response.json();
        if (!data.access || !data.refresh) {
            throw new Error("Invalid token response from server");
        }
        setAuthToken(data.access);
        setRefreshToken(data.refresh);
        return data;
    } catch (error) {
        clearTimeout(timeoutId);
        controller.abort();
        if (error.name === 'AbortError') {
            throw new Error("Login timeout - server is not responding");
        }
        throw error;
    }
}
async function refreshAccessToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        throw new Error("No refresh token available");
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(()=>controller.abort(), 5000);
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                refresh: refreshToken
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            removeAuthTokens();
            throw new Error("Failed to refresh token");
        }
        const data = await response.json();
        if (!data.access) {
            throw new Error("Invalid token refresh response");
        }
        setAuthToken(data.access);
        return data.access;
    } catch (error) {
        clearTimeout(timeoutId);
        controller.abort();
        if (error.name === 'AbortError') {
            removeAuthTokens();
            throw new Error("Token refresh timeout");
        }
        throw error;
    }
}
async function getAdminProfile() {
    const token = getAuthToken();
    if (!token) {
        return null;
    }
    try {
        const payload = decodeJWT(token);
        if (payload) {
            const profile = {
                id: (payload.user_id || payload.id || "unknown").toString(),
                email: payload.email || "",
                name: payload.name || `${payload.first_name || ''} ${payload.last_name || ''}`.trim() || payload.username || "Admin User",
                role: payload.role || "admin",
                is_superuser: !!payload.is_superuser,
                is_staff: !!payload.is_staff,
                two_factor_enabled: !!payload.two_factor_enabled
            };
            if (payload.username) profile.username = payload.username;
            if (payload.first_name) profile.first_name = payload.first_name;
            if (payload.last_name) profile.last_name = payload.last_name;
            return profile;
        }
        return {
            id: "admin-1",
            email: "admin@example.com",
            name: "Administrator",
            role: "ADMIN",
            username: "admin_user",
            two_factor_enabled: false
        };
    } catch (error) {
        console.error("Failed to get admin profile:", error);
        try {
            const newToken = await refreshAccessToken();
            return getAdminProfile();
        } catch (refreshError) {
            removeAuthTokens();
            return null;
        }
    }
}
// Helper function to decode JWT token
function decodeJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map((c)=>'%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error("Failed to decode JWT:", error);
        return null;
    }
}
function isAuthenticated() {
    const token = getAuthToken();
    if (!token) return false;
    try {
        const payload = decodeJWT(token);
        if (!payload) return false;
        const currentTime = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < currentTime) {
            return false;
        }
        return true;
    } catch (error) {
        return false;
    }
}
function logoutAdmin(message) {
    removeAuthTokens();
    if ("TURBOPACK compile-time truthy", 1) {
        const redirectUrl = message ? `/login?message=${message}` : "/login";
        window.location.href = redirectUrl;
    }
}
async function authApiRequest(endpoint, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(()=>controller.abort(), 15000);
    try {
        let token = getAuthToken();
        const headers = {
            "Content-Type": "application/json"
        };
        if (options?.headers) {
            if (options.headers instanceof Headers) {
                options.headers.forEach((value, key)=>{
                    headers[key] = value;
                });
            } else if (Array.isArray(options.headers)) {
                options.headers.forEach(([key, value])=>{
                    headers[key] = value;
                });
            } else {
                Object.entries(options.headers).forEach(([key, value])=>{
                    headers[key] = String(value);
                });
            }
        }
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: headers,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (response.status === 401 && token) {
            try {
                const newToken = await refreshAccessToken();
                headers.Authorization = `Bearer ${newToken}`;
                const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
                    ...options,
                    headers: headers,
                    signal: controller.signal
                });
                if (!retryResponse.ok) {
                    throw new Error(`API Error: ${retryResponse.status} ${retryResponse.statusText}`);
                }
                return retryResponse.json();
            } catch (refreshError) {
                logoutAdmin();
                throw new Error("Session expired. Please login again.");
            }
        }
        if (!response.ok) {
            let errorMessage = `API Error: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }
                // Handle specific session invalidation error
                if (errorMessage.includes("This session is no longer valid. Another device has logged in.")) {
                    logoutAdmin("session_invalid");
                    throw new Error("This session is no longer valid. Another device has logged in. Please login again and change your password.");
                }
            } catch  {
                // If response is not JSON, try to get text
                try {
                    const errorText = await response.text();
                    if (errorText) {
                        errorMessage = errorText;
                        if (errorText.includes("This session is no longer valid. Another device has logged in.")) {
                            logoutAdmin("session_invalid");
                            throw new Error("This session is no longer valid. Another device has logged in. Please login again and change your password.");
                        }
                    }
                } catch  {
                // Ignore text parsing errors
                }
            }
            throw new Error(errorMessage);
        }
        return response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        controller.abort();
        console.error(`API request failed: ${endpoint}`, error);
        if (error.name === 'AbortError') {
            throw new Error("Request timeout - server is not responding");
        }
        throw error;
    }
}
async function testEndpoint(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'OPTIONS',
            headers: {
                'Accept': 'application/json'
            }
        });
        return response.status === 200 || response.status === 405;
    } catch  {
        return false;
    }
}
function getApiBaseUrl() {
    return API_BASE_URL;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/ui/button.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button,
    "buttonVariants",
    ()=>buttonVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive", {
    variants: {
        variant: {
            default: 'bg-primary text-primary-foreground hover:bg-primary/90',
            destructive: 'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
            outline: 'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
            secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
            ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
            link: 'text-primary underline-offset-4 hover:underline'
        },
        size: {
            default: 'h-9 px-4 py-2 has-[>svg]:px-3',
            sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
            lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
            icon: 'size-9',
            'icon-sm': 'size-8',
            'icon-lg': 'size-10'
        }
    },
    defaultVariants: {
        variant: 'default',
        size: 'default'
    }
});
function Button({ className, variant, size, asChild = false, ...props }) {
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Slot"] : 'button';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        "data-slot": "button",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
            variant,
            size,
            className
        })),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/button.tsx",
        lineNumber: 55,
        columnNumber: 5
    }, this);
}
_c = Button;
;
var _c;
__turbopack_context__.k.register(_c, "Button");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/ui/alert-dialog.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AlertDialog",
    ()=>AlertDialog,
    "AlertDialogAction",
    ()=>AlertDialogAction,
    "AlertDialogCancel",
    ()=>AlertDialogCancel,
    "AlertDialogContent",
    ()=>AlertDialogContent,
    "AlertDialogDescription",
    ()=>AlertDialogDescription,
    "AlertDialogFooter",
    ()=>AlertDialogFooter,
    "AlertDialogHeader",
    ()=>AlertDialogHeader,
    "AlertDialogOverlay",
    ()=>AlertDialogOverlay,
    "AlertDialogPortal",
    ()=>AlertDialogPortal,
    "AlertDialogTitle",
    ()=>AlertDialogTitle,
    "AlertDialogTrigger",
    ()=>AlertDialogTrigger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$alert$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-alert-dialog/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/button.tsx [app-client] (ecmascript)");
'use client';
;
;
;
;
function AlertDialog({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$alert$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"], {
        "data-slot": "alert-dialog",
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/alert-dialog.tsx",
        lineNumber: 12,
        columnNumber: 10
    }, this);
}
_c = AlertDialog;
function AlertDialogTrigger({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$alert$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Trigger"], {
        "data-slot": "alert-dialog-trigger",
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/alert-dialog.tsx",
        lineNumber: 19,
        columnNumber: 5
    }, this);
}
_c1 = AlertDialogTrigger;
function AlertDialogPortal({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$alert$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Portal"], {
        "data-slot": "alert-dialog-portal",
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/alert-dialog.tsx",
        lineNumber: 27,
        columnNumber: 5
    }, this);
}
_c2 = AlertDialogPortal;
function AlertDialogOverlay({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$alert$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Overlay"], {
        "data-slot": "alert-dialog-overlay",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/alert-dialog.tsx",
        lineNumber: 36,
        columnNumber: 5
    }, this);
}
_c3 = AlertDialogOverlay;
function AlertDialogContent({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AlertDialogPortal, {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AlertDialogOverlay, {}, void 0, false, {
                fileName: "[project]/components/ui/alert-dialog.tsx",
                lineNumber: 53,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$alert$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Content"], {
                "data-slot": "alert-dialog-content",
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg', className),
                ...props
            }, void 0, false, {
                fileName: "[project]/components/ui/alert-dialog.tsx",
                lineNumber: 54,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/ui/alert-dialog.tsx",
        lineNumber: 52,
        columnNumber: 5
    }, this);
}
_c4 = AlertDialogContent;
function AlertDialogHeader({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "alert-dialog-header",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex flex-col gap-2 text-center sm:text-left', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/alert-dialog.tsx",
        lineNumber: 71,
        columnNumber: 5
    }, this);
}
_c5 = AlertDialogHeader;
function AlertDialogFooter({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "alert-dialog-footer",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/alert-dialog.tsx",
        lineNumber: 84,
        columnNumber: 5
    }, this);
}
_c6 = AlertDialogFooter;
function AlertDialogTitle({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$alert$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Title"], {
        "data-slot": "alert-dialog-title",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-lg font-semibold', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/alert-dialog.tsx",
        lineNumber: 100,
        columnNumber: 5
    }, this);
}
_c7 = AlertDialogTitle;
function AlertDialogDescription({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$alert$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Description"], {
        "data-slot": "alert-dialog-description",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-muted-foreground text-sm', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/alert-dialog.tsx",
        lineNumber: 113,
        columnNumber: 5
    }, this);
}
_c8 = AlertDialogDescription;
function AlertDialogAction({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$alert$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Action"], {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buttonVariants"])(), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/alert-dialog.tsx",
        lineNumber: 126,
        columnNumber: 5
    }, this);
}
_c9 = AlertDialogAction;
function AlertDialogCancel({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$alert$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Cancel"], {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buttonVariants"])({
            variant: 'outline'
        }), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/alert-dialog.tsx",
        lineNumber: 138,
        columnNumber: 5
    }, this);
}
_c10 = AlertDialogCancel;
;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10;
__turbopack_context__.k.register(_c, "AlertDialog");
__turbopack_context__.k.register(_c1, "AlertDialogTrigger");
__turbopack_context__.k.register(_c2, "AlertDialogPortal");
__turbopack_context__.k.register(_c3, "AlertDialogOverlay");
__turbopack_context__.k.register(_c4, "AlertDialogContent");
__turbopack_context__.k.register(_c5, "AlertDialogHeader");
__turbopack_context__.k.register(_c6, "AlertDialogFooter");
__turbopack_context__.k.register(_c7, "AlertDialogTitle");
__turbopack_context__.k.register(_c8, "AlertDialogDescription");
__turbopack_context__.k.register(_c9, "AlertDialogAction");
__turbopack_context__.k.register(_c10, "AlertDialogCancel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/auth/inactivity-warning.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "InactivityWarning",
    ()=>InactivityWarning
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/alert-dialog.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/log-out.js [app-client] (ecmascript) <export default as LogOut>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function InactivityWarning({ open, remainingSeconds, onStayLoggedIn, onLogout }) {
    _s();
    const [countdown, setCountdown] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(remainingSeconds);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "InactivityWarning.useEffect": ()=>{
            setCountdown(remainingSeconds);
        }
    }["InactivityWarning.useEffect"], [
        remainingSeconds
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "InactivityWarning.useEffect": ()=>{
            if (!open) return;
            const interval = setInterval({
                "InactivityWarning.useEffect.interval": ()=>{
                    setCountdown({
                        "InactivityWarning.useEffect.interval": (prev)=>{
                            if (prev <= 1) {
                                clearInterval(interval);
                                onLogout();
                                return 0;
                            }
                            return prev - 1;
                        }
                    }["InactivityWarning.useEffect.interval"]);
                }
            }["InactivityWarning.useEffect.interval"], 1000);
            return ({
                "InactivityWarning.useEffect": ()=>clearInterval(interval)
            })["InactivityWarning.useEffect"];
        }
    }["InactivityWarning.useEffect"], [
        open,
        onLogout
    ]);
    const formatTime = (seconds)=>{
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlertDialog"], {
        open: open,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlertDialogContent"], {
            className: "max-w-md",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlertDialogHeader"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-3 mb-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                        className: "h-6 w-6 text-orange-600 dark:text-orange-400 animate-pulse"
                                    }, void 0, false, {
                                        fileName: "[project]/components/auth/inactivity-warning.tsx",
                                        lineNumber: 64,
                                        columnNumber: 29
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/auth/inactivity-warning.tsx",
                                    lineNumber: 63,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlertDialogTitle"], {
                                    className: "text-xl",
                                    children: "Session Timeout Warning"
                                }, void 0, false, {
                                    fileName: "[project]/components/auth/inactivity-warning.tsx",
                                    lineNumber: 66,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/auth/inactivity-warning.tsx",
                            lineNumber: 62,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlertDialogDescription"], {
                            className: "text-base space-y-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    children: "You've been inactive for a while. For security reasons, you'll be automatically logged out in:"
                                }, void 0, false, {
                                    fileName: "[project]/components/auth/inactivity-warning.tsx",
                                    lineNumber: 69,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-center py-4",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-4xl font-bold text-orange-600 dark:text-orange-400 tabular-nums",
                                        children: formatTime(countdown)
                                    }, void 0, false, {
                                        fileName: "[project]/components/auth/inactivity-warning.tsx",
                                        lineNumber: 73,
                                        columnNumber: 29
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/auth/inactivity-warning.tsx",
                                    lineNumber: 72,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-muted-foreground",
                                    children: 'Click "Stay Logged In" to continue your session, or you\'ll be logged out automatically.'
                                }, void 0, false, {
                                    fileName: "[project]/components/auth/inactivity-warning.tsx",
                                    lineNumber: 77,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/auth/inactivity-warning.tsx",
                            lineNumber: 68,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/auth/inactivity-warning.tsx",
                    lineNumber: 61,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlertDialogFooter"], {
                    className: "gap-2 sm:gap-0",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlertDialogCancel"], {
                            onClick: onLogout,
                            className: "gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                                    className: "h-4 w-4"
                                }, void 0, false, {
                                    fileName: "[project]/components/auth/inactivity-warning.tsx",
                                    lineNumber: 84,
                                    columnNumber: 25
                                }, this),
                                "Logout Now"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/auth/inactivity-warning.tsx",
                            lineNumber: 83,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlertDialogAction"], {
                            onClick: onStayLoggedIn,
                            className: "gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                    className: "h-4 w-4"
                                }, void 0, false, {
                                    fileName: "[project]/components/auth/inactivity-warning.tsx",
                                    lineNumber: 88,
                                    columnNumber: 25
                                }, this),
                                "Stay Logged In"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/auth/inactivity-warning.tsx",
                            lineNumber: 87,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/auth/inactivity-warning.tsx",
                    lineNumber: 82,
                    columnNumber: 17
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/auth/inactivity-warning.tsx",
            lineNumber: 60,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/auth/inactivity-warning.tsx",
        lineNumber: 59,
        columnNumber: 9
    }, this);
}
_s(InactivityWarning, "KeVI5LGihDoX3iNRDO6nREkufkY=");
_c = InactivityWarning;
var _c;
__turbopack_context__.k.register(_c, "InactivityWarning");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/contexts/auth-context.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/permissions.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$inactivity$2d$warning$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/auth/inactivity-warning.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function AuthProvider({ children }) {
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [sidebarOpen, setSidebarOpenState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [localPermissions, setLocalPermissions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PERMISSIONS"]));
    const [lastActivity, setLastActivity] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(Date.now());
    const [showInactivityWarning, setShowInactivityWarning] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [warningCountdown, setWarningCountdown] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(120);
    const [loginTimestamp, setLoginTimestamp] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [clientIp, setClientIp] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isIpBlocked, setIsIpBlocked] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            const initializeAuth = {
                "AuthProvider.useEffect.initializeAuth": async ()=>{
                    console.log("[Auth] Initializing...");
                    try {
                        const storedUserData = localStorage.getItem('admin_user_data');
                        console.log("[Auth] Stored user data raw:", storedUserData);
                        const parsedStoredUser = storedUserData ? JSON.parse(storedUserData) : null;
                        if (parsedStoredUser) {
                            console.log("[Auth] Setting initial user from storage:", parsedStoredUser.username);
                            setUser(parsedStoredUser);
                        }
                        const token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAccessToken"])();
                        if (token) {
                            try {
                                console.log("[Auth] Refreshing admin profile from token...");
                                const freshUser = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAdminProfile"])();
                                if (freshUser) {
                                    console.log("[Auth] Profile data retrieved:", freshUser.username);
                                    // Defensive merge: Only overwrite if freshUser has values
                                    const adaptedUser = {
                                        ...parsedStoredUser,
                                        ...freshUser,
                                        id: freshUser.id || parsedStoredUser?.id || "unknown",
                                        username: freshUser.username || parsedStoredUser?.username || "",
                                        email: freshUser.email || parsedStoredUser?.email || "",
                                        first_name: freshUser.first_name || parsedStoredUser?.first_name || freshUser.name?.split(' ')[0] || "",
                                        last_name: freshUser.last_name || parsedStoredUser?.last_name || freshUser.name?.split(' ').slice(1).join(' ') || "",
                                        role: freshUser.role || parsedStoredUser?.role || "admin",
                                        is_approved: true
                                    };
                                    console.log("[Auth] Final adapted user:", adaptedUser);
                                    setUser(adaptedUser);
                                    localStorage.setItem('admin_user_data', JSON.stringify(adaptedUser));
                                    if (adaptedUser.username?.toUpperCase() === 'TUTU') {
                                        console.log("[Auth] MASTER USER TUTU ACTIVE");
                                    }
                                    try {
                                        const perms = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchLocalPermissions"])(adaptedUser.id);
                                        if (perms && perms.length > 0) {
                                            setLocalPermissions(perms);
                                        } else {
                                            setLocalPermissions(Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PERMISSIONS"]));
                                        }
                                    } catch (e) {
                                        console.error("[Auth] Permission fetch failed:", e);
                                        setLocalPermissions(Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PERMISSIONS"]));
                                    }
                                }
                            } catch (e) {
                                console.error("[Auth] Token profile sync failed:", e);
                            }
                        }
                        const savedSidebarState = localStorage.getItem('sidebar_open');
                        if (savedSidebarState !== null) {
                            setSidebarOpenState(JSON.parse(savedSidebarState));
                        }
                        const savedLoginTimestamp = localStorage.getItem('admin_login_timestamp');
                        if (savedLoginTimestamp) {
                            const timestamp = parseInt(savedLoginTimestamp);
                            setLoginTimestamp(timestamp);
                            // Immediate check on initialization
                            const SESSION_DURATION = 60 * 60 * 1000 // 1 hour
                            ;
                            if (Date.now() - timestamp >= SESSION_DURATION) {
                                console.log("[Auth] Absolute session expired on init");
                                logout();
                                return;
                            }
                        }
                        // If user is from storage but no fresh profile was fetched (or failed), still try to get perms
                        if (parsedStoredUser && !token) {
                            try {
                                const perms = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchLocalPermissions"])(parsedStoredUser.id);
                                if (perms && perms.length > 0) {
                                    setLocalPermissions(perms);
                                } else {
                                    setLocalPermissions(Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PERMISSIONS"]));
                                }
                            } catch (e) {
                                setLocalPermissions(Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PERMISSIONS"]));
                            }
                        }
                    } finally{
                        setIsLoading(false);
                    }
                }
            }["AuthProvider.useEffect.initializeAuth"];
            const fetchClientIp = {
                "AuthProvider.useEffect.fetchClientIp": async ()=>{
                    try {
                        const response = await fetch('https://api.ipify.org?format=json');
                        const data = await response.json();
                        setClientIp(data.ip);
                        return data.ip;
                    } catch (e) {
                        console.error("[Auth] Failed to fetch client IP", e);
                        return null;
                    }
                }
            }["AuthProvider.useEffect.fetchClientIp"];
            const checkIpWhitelist = {
                "AuthProvider.useEffect.checkIpWhitelist": async (ip)=>{
                    try {
                        const config = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPlatformConfig"])();
                        if (config && config.ip_whitelist_enabled && config.ip_whitelist) {
                            const whitelist = config.ip_whitelist.split(',').map({
                                "AuthProvider.useEffect.checkIpWhitelist.whitelist": (item)=>item.trim()
                            }["AuthProvider.useEffect.checkIpWhitelist.whitelist"]);
                            if (whitelist.length > 0 && !whitelist.includes(ip)) {
                                console.log("[Auth] IP Blocked:", ip);
                                setIsIpBlocked(true);
                            }
                        }
                    } catch (e) {
                        console.error("[Auth] Failed to check IP whitelist", e);
                    }
                }
            }["AuthProvider.useEffect.checkIpWhitelist"];
            const init = {
                "AuthProvider.useEffect.init": async ()=>{
                    const ip = await fetchClientIp();
                    if (ip) {
                        await checkIpWhitelist(ip);
                    }
                    await initializeAuth();
                }
            }["AuthProvider.useEffect.init"];
            init();
        }
    }["AuthProvider.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            localStorage.setItem('sidebar_open', JSON.stringify(sidebarOpen));
        }
    }["AuthProvider.useEffect"], [
        sidebarOpen
    ]);
    // Inactivity tracking and auto-logout
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            if (!user) return;
            const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes
            ;
            const WARNING_TIME = 60 * 1000 // 1 minute
            ;
            const resetActivity = {
                "AuthProvider.useEffect.resetActivity": ()=>{
                    setLastActivity(Date.now());
                    setShowInactivityWarning(false);
                    setWarningCountdown(120);
                }
            }["AuthProvider.useEffect.resetActivity"];
            const events = [
                'mousedown',
                'keydown',
                'touchstart',
                'scroll',
                'click'
            ];
            events.forEach({
                "AuthProvider.useEffect": (event)=>{
                    window.addEventListener(event, resetActivity);
                }
            }["AuthProvider.useEffect"]);
            const checkInterval = setInterval({
                "AuthProvider.useEffect.checkInterval": ()=>{
                    const now = Date.now();
                    const timeSinceActivity = now - lastActivity;
                    if (timeSinceActivity >= INACTIVITY_TIMEOUT - WARNING_TIME && !showInactivityWarning) {
                        setShowInactivityWarning(true);
                        const remainingSeconds = Math.floor((INACTIVITY_TIMEOUT - timeSinceActivity) / 1000);
                        setWarningCountdown(remainingSeconds);
                    }
                    if (timeSinceActivity >= INACTIVITY_TIMEOUT) {
                        logout();
                    }
                }
            }["AuthProvider.useEffect.checkInterval"], 10000);
            return ({
                "AuthProvider.useEffect": ()=>{
                    events.forEach({
                        "AuthProvider.useEffect": (event)=>{
                            window.removeEventListener(event, resetActivity);
                        }
                    }["AuthProvider.useEffect"]);
                    clearInterval(checkInterval);
                }
            })["AuthProvider.useEffect"];
        }
    }["AuthProvider.useEffect"], [
        user,
        lastActivity,
        showInactivityWarning
    ]);
    // Absolute session timeout check (1 hour from login)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            if (!user || !loginTimestamp) return;
            const SESSION_DURATION = 60 * 60 * 1000 // 1 hour
            ;
            const checkSessionExpiry = {
                "AuthProvider.useEffect.checkSessionExpiry": ()=>{
                    const now = Date.now();
                    if (now - loginTimestamp >= SESSION_DURATION) {
                        console.log("[Auth] Absolute session expired (1 hour reached)");
                        logout();
                    }
                }
            }["AuthProvider.useEffect.checkSessionExpiry"];
            // Check every minute
            const interval = setInterval(checkSessionExpiry, 60000);
            // Initial check
            checkSessionExpiry();
            return ({
                "AuthProvider.useEffect": ()=>clearInterval(interval)
            })["AuthProvider.useEffect"];
        }
    }["AuthProvider.useEffect"], [
        user,
        loginTimestamp
    ]);
    const setSidebarOpen = (open)=>{
        setSidebarOpenState(open);
    };
    const toggleSidebar = ()=>{
        setSidebarOpenState((prev)=>!prev);
    };
    const openSidebar = ()=>{
        setSidebarOpenState(true);
    };
    const closeSidebar = ()=>{
        setSidebarOpenState(false);
    };
    const login = async (userData, token)=>{
        setIsLoading(true);
        // Double check IP on login
        if (clientIp) {
            try {
                const config = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPlatformConfig"])();
                if (config && config.ip_whitelist_enabled && config.ip_whitelist) {
                    const whitelist = config.ip_whitelist.split(',').map((item)=>item.trim());
                    if (whitelist.length > 0 && !whitelist.includes(clientIp)) {
                        setIsIpBlocked(true);
                        return; // Stop login
                    }
                }
            } catch (e) {
                console.error("[Auth] Login IP check failed", e);
            }
        }
        const now = Date.now();
        setUser(userData);
        setLoginTimestamp(now);
        localStorage.setItem('admin_user_data', JSON.stringify(userData));
        localStorage.setItem('admin_access_token', token);
        localStorage.setItem('admin_login_timestamp', now.toString());
        try {
            const perms = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchLocalPermissions"])(userData.id);
            if (perms && perms.length > 0) {
                setLocalPermissions(perms);
            } else {
                setLocalPermissions(Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PERMISSIONS"]));
            }
        } catch (e) {
            console.error("[Auth] Login permission fetch failed", e);
            setLocalPermissions(Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PERMISSIONS"]));
        } finally{
            setIsLoading(false);
        }
    };
    const logout = ()=>{
        setUser(null);
        setLocalPermissions([]);
        setSidebarOpenState(true);
        localStorage.removeItem('admin_user_data');
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('sidebar_open');
        localStorage.removeItem('admin_login_timestamp');
        localStorage.removeItem('single_login_session');
        sessionStorage.removeItem('2fa_warning_shown');
        window.location.href = '/login';
    };
    const role = user ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getUserRole"])(user) : null;
    const checkHasPermission = (permission)=>{
        if (!user) return false;
        if (user.is_superuser || user.username && user.username.toUpperCase() === 'TUTU') return true;
        return localPermissions.includes(permission);
    };
    const checkHasAnyPermission = (permissions)=>{
        if (!user) return false;
        if (user.is_superuser || user.username && user.username.toUpperCase() === 'TUTU') return true;
        return permissions.some((p)=>localPermissions.includes(p));
    };
    const checkHasAllPermissions = (permissions)=>{
        if (!user) return false;
        if (user.is_superuser || user.username && user.username.toUpperCase() === 'TUTU') return true;
        return permissions.every((p)=>localPermissions.includes(p));
    };
    const value = {
        user,
        role,
        isLoading,
        sidebarOpen,
        login,
        logout,
        hasPermission: checkHasPermission,
        hasAnyPermission: checkHasAnyPermission,
        hasAllPermissions: checkHasAllPermissions,
        toggleSidebar,
        openSidebar,
        closeSidebar,
        setSidebarOpen
    };
    const handleStayLoggedIn = ()=>{
        setLastActivity(Date.now());
        setShowInactivityWarning(false);
        setWarningCountdown(120);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: value,
        children: isIpBlocked ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-w-md w-full space-y-8 text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-2xl font-mono text-slate-800",
                        children: "System Maintenance"
                    }, void 0, false, {
                        fileName: "[project]/contexts/auth-context.tsx",
                        lineNumber: 378,
                        columnNumber: 25
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-slate-600 font-mono text-sm leading-relaxed",
                        children: [
                            "Error Code: 0x8004100E",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                fileName: "[project]/contexts/auth-context.tsx",
                                lineNumber: 380,
                                columnNumber: 51
                            }, this),
                            "The requested resource is temporarily unavailable due to scheduled maintenance. Please try again in approximately 42 minutes. If the problem persists, contact your network administrator."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/contexts/auth-context.tsx",
                        lineNumber: 379,
                        columnNumber: 25
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "pt-8 text-[10px] text-slate-400 font-mono",
                        children: [
                            "SESSION_ID: ",
                            Math.random().toString(36).substring(7).toUpperCase(),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                fileName: "[project]/contexts/auth-context.tsx",
                                lineNumber: 387,
                                columnNumber: 29
                            }, this),
                            "TRACE_ID: ",
                            Math.random().toString(36).substring(7).toUpperCase()
                        ]
                    }, void 0, true, {
                        fileName: "[project]/contexts/auth-context.tsx",
                        lineNumber: 385,
                        columnNumber: 25
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/contexts/auth-context.tsx",
                lineNumber: 377,
                columnNumber: 21
            }, this)
        }, void 0, false, {
            fileName: "[project]/contexts/auth-context.tsx",
            lineNumber: 376,
            columnNumber: 17
        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                children,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$inactivity$2d$warning$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InactivityWarning"], {
                    open: showInactivityWarning,
                    remainingSeconds: warningCountdown,
                    onStayLoggedIn: handleStayLoggedIn,
                    onLogout: logout
                }, void 0, false, {
                    fileName: "[project]/contexts/auth-context.tsx",
                    lineNumber: 395,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true)
    }, void 0, false, {
        fileName: "[project]/contexts/auth-context.tsx",
        lineNumber: 374,
        columnNumber: 9
    }, this);
}
_s(AuthProvider, "1SXpJ9s1h1y5h6k0PITmesiSGus=");
_c = AuthProvider;
function useAuth() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/ui/page-loader.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PageLoader",
    ()=>PageLoader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-client] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
"use client";
;
;
;
function PageLoader({ message = "Loading...", className, fullScreen = true }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-col items-center justify-center gap-4", fullScreen ? "min-h-screen" : "min-h-[400px]", className),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 rounded-full border-4 border-primary/20 animate-ping"
                    }, void 0, false, {
                        fileName: "[project]/components/ui/page-loader.tsx",
                        lineNumber: 27,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                        className: "h-12 w-12 animate-spin text-primary"
                    }, void 0, false, {
                        fileName: "[project]/components/ui/page-loader.tsx",
                        lineNumber: 30,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ui/page-loader.tsx",
                lineNumber: 25,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-2 text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-lg font-medium text-foreground animate-pulse",
                        children: message
                    }, void 0, false, {
                        fileName: "[project]/components/ui/page-loader.tsx",
                        lineNumber: 35,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-1 justify-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-2 w-2 rounded-full bg-primary animate-bounce",
                                style: {
                                    animationDelay: "0ms"
                                }
                            }, void 0, false, {
                                fileName: "[project]/components/ui/page-loader.tsx",
                                lineNumber: 39,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-2 w-2 rounded-full bg-primary animate-bounce",
                                style: {
                                    animationDelay: "150ms"
                                }
                            }, void 0, false, {
                                fileName: "[project]/components/ui/page-loader.tsx",
                                lineNumber: 40,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-2 w-2 rounded-full bg-primary animate-bounce",
                                style: {
                                    animationDelay: "300ms"
                                }
                            }, void 0, false, {
                                fileName: "[project]/components/ui/page-loader.tsx",
                                lineNumber: 41,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ui/page-loader.tsx",
                        lineNumber: 38,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ui/page-loader.tsx",
                lineNumber: 34,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/ui/page-loader.tsx",
        lineNumber: 18,
        columnNumber: 9
    }, this);
}
_c = PageLoader;
var _c;
__turbopack_context__.k.register(_c, "PageLoader");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/auth/auth-guard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthGuard",
    ()=>AuthGuard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/contexts/auth-context.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$page$2d$loader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/page-loader.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function AuthGuard({ children }) {
    _s();
    const { user, isLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const isLoginPage = pathname === "/login";
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthGuard.useEffect": ()=>{
            if (isLoading) return;
            if (!user && !isLoginPage) {
                router.push("/login");
            } else if (user && isLoginPage) {
                router.push("/sys-admin");
            }
        }
    }["AuthGuard.useEffect"], [
        user,
        isLoading,
        isLoginPage,
        router
    ]);
    if (isLoading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$page$2d$loader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PageLoader"], {
            message: "Secure Authentication..."
        }, void 0, false, {
            fileName: "[project]/components/auth/auth-guard.tsx",
            lineNumber: 25,
            columnNumber: 16
        }, this);
    }
    // Prevent flash of protected content during transition
    if (!user && !isLoginPage) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$page$2d$loader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PageLoader"], {
            message: "Access verification required..."
        }, void 0, false, {
            fileName: "[project]/components/auth/auth-guard.tsx",
            lineNumber: 30,
            columnNumber: 16
        }, this);
    }
    if (user && isLoginPage) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$page$2d$loader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PageLoader"], {
            message: "Entering Command Center..."
        }, void 0, false, {
            fileName: "[project]/components/auth/auth-guard.tsx",
            lineNumber: 34,
            columnNumber: 16
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: children
    }, void 0, false);
}
_s(AuthGuard, "5Zav7NL5wHD1ujAgNYEln1oswkI=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
    ];
});
_c = AuthGuard;
var _c;
__turbopack_context__.k.register(_c, "AuthGuard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/theme-provider.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ThemeProvider",
    ()=>ThemeProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-themes/dist/index.mjs [app-client] (ecmascript)");
'use client';
;
;
function ThemeProvider({ children, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ThemeProvider"], {
        ...props,
        children: children
    }, void 0, false, {
        fileName: "[project]/components/theme-provider.tsx",
        lineNumber: 10,
        columnNumber: 10
    }, this);
}
_c = ThemeProvider;
var _c;
__turbopack_context__.k.register(_c, "ThemeProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/ui/top-progress-bar.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TopProgressBar",
    ()=>TopProgressBar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function ProgressBarContent() {
    _s();
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProgressBarContent.useEffect": ()=>{
            setIsLoading(true);
            const timeout = setTimeout({
                "ProgressBarContent.useEffect.timeout": ()=>setIsLoading(false)
            }["ProgressBarContent.useEffect.timeout"], 1000);
            return ({
                "ProgressBarContent.useEffect": ()=>clearTimeout(timeout)
            })["ProgressBarContent.useEffect"];
        }
    }["ProgressBarContent.useEffect"], [
        pathname,
        searchParams
    ]);
    if (!isLoading) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "top-progress-bar"
    }, void 0, false, {
        fileName: "[project]/components/ui/top-progress-bar.tsx",
        lineNumber: 19,
        columnNumber: 12
    }, this);
}
_s(ProgressBarContent, "17OwKo9MWNyutpS3ccpz+XJHYHI=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"]
    ];
});
_c = ProgressBarContent;
function TopProgressBar() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Suspense"], {
        fallback: null,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ProgressBarContent, {}, void 0, false, {
            fileName: "[project]/components/ui/top-progress-bar.tsx",
            lineNumber: 25,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/ui/top-progress-bar.tsx",
        lineNumber: 24,
        columnNumber: 9
    }, this);
}
_c1 = TopProgressBar;
var _c, _c1;
__turbopack_context__.k.register(_c, "ProgressBarContent");
__turbopack_context__.k.register(_c1, "TopProgressBar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_40cc401f._.js.map