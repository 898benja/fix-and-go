import { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
export const colors = {
  ink: "#171717",
  muted: "#535353",
  yellow: "#FFC448",
  background: "#F6F6F6",
  border: "#DCE4E3",
  white: "#FFFFFF",
};
export function Button({
  label,
  onPress,
  busy = false,
  secondary = false,
  disabled = false,
  destructive = false,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  secondary?: boolean;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: busy || disabled, busy }}
      disabled={busy || disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        destructive && { backgroundColor: "#A62A21" },
        (pressed || busy || disabled) && { opacity: 0.55 },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={secondary ? colors.ink : colors.white} />
      ) : (
        <Text style={[s.buttonText, secondary && {color: colors.ink}]}>{label}</Text>
      )}
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#7D8D94"
        {...props}
        style={[
          s.input,
          props.multiline && { minHeight: 100, textAlignVertical: "top" },
          props.style,
        ]}
      />
    </View>
  );
}
export function Card({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return <View style={[s.card, compact && {width:"100%", maxWidth:520}]}>{children}</View>;
}
export function Chips({
  items,
  selected,
  onSelect,
}: {
  items: { id: number; name: string }[];
  selected: number[];
  onSelect: (id: number) => void;
}) {
  return (
    <View style={s.wrap}>
      {items.map((item) => (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: selected.includes(item.id) }}
          key={item.id}
          onPress={() => onSelect(item.id)}
          style={[s.chip, selected.includes(item.id) && s.chipSelected]}
        >
          <Text
            style={[
              s.chipText,
              selected.includes(item.id) && { color: "white" },
            ]}
          >
            {item.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 22, gap: 18, paddingBottom: 36 },
  heading: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    color: colors.ink,
  },
  title: { fontSize: 20, fontWeight: "700", color: colors.ink },
  body: { fontSize: 17, lineHeight: 26, color: colors.muted },
  label: { fontSize: 15, fontWeight: "600", color: colors.ink },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    gap: 13,
    borderWidth: 1,
    borderColor: "#E6ECE9",
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    minHeight: 50,
    fontSize: 16,
    color: colors.ink,
  },
  button: {
    backgroundColor: colors.ink,
    minHeight: 50,
    padding: 14,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontWeight: "700", fontSize: 16, color: colors.white },
  secondary: { backgroundColor: "#EAF0EF" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "#E9EFED",
    minHeight: 44,
    justifyContent: "center",
  },
  chipSelected: { backgroundColor: colors.ink },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.ink },
  hero: { backgroundColor: colors.ink, padding: 24, borderRadius: 24, gap: 14 },
  badge: {
    color: "#84600C",
    backgroundColor: "#FFF0CB",
    borderRadius: 8,
    padding: 8,
    alignSelf: "flex-start",
    fontWeight: "600",
    fontSize: 12,
  },
});

/** Persistent feedback: readable text, semantic announcements, no disappearing errors. */
export function Notice({message, title, tone = "error", onDismiss}: {
  message: string; title?: string; tone?: "error" | "success" | "warning" | "info"; onDismiss?: () => void;
}) {
  const palette = {
    error: {bg:"#FFF1F0", ink:"#8A251E", label:"No pudimos completar la acción", icon:"!"},
    success: {bg:"#EAF5EF", ink:"#185B36", label:"Todo listo", icon:"✓"},
    warning: {bg:"#FFF6DF", ink:"#6F4B00", label:"Revisa esta información", icon:"!"},
    info: {bg:"#ECF2FA", ink:"#23466D", label:"Información del servicio", icon:"i"},
  }[tone];
  return <View accessibilityRole={tone === "error" ? "alert" : undefined}
    accessibilityLiveRegion={tone === "error" ? "assertive" : "polite"}
    style={{backgroundColor:palette.bg, borderRadius:16, padding:16, gap:10, borderLeftWidth:4, borderLeftColor:palette.ink}}>
    <View style={{flexDirection:"row", gap:10, alignItems:"flex-start"}}>
      <Text accessible={false} style={{color:palette.ink,fontSize:20,fontWeight:"800"}}>{palette.icon}</Text>
      <View style={{flex:1,gap:5}}><Text style={{color:palette.ink,fontSize:16,fontWeight:"700"}}>{title ?? palette.label}</Text>
        <Text selectable style={{color:palette.ink,fontSize:16,lineHeight:24}}>{message}</Text></View>
    </View>
    {onDismiss && <Button secondary label="Cerrar aviso" onPress={onDismiss}/>}
  </View>;
}
