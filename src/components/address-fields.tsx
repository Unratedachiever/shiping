import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { CITIES } from "@/lib/cities";
import type { AddressInput } from "@/lib/types";

const COUNTRIES = ["United States", "Canada", "United Kingdom", "Mexico", "Japan", "France", "Germany", "Australia", "Singapore"];

export const emptyAddress = (): AddressInput => ({
  fullName: "",
  phone: "",
  email: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "United States",
});

export function AddressFields({
  id,
  value,
  onChange,
}: {
  id: string;
  value: AddressInput;
  onChange: (next: AddressInput) => void;
}) {
  function set<K extends keyof AddressInput>(key: K, v: AddressInput[K]) {
    onChange({ ...value, [key]: v });
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={`${id}-name`}>Full name</Label>
        <Input id={`${id}-name`} value={value.fullName} onChange={(e) => set("fullName", e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-phone`}>Phone</Label>
        <Input id={`${id}-phone`} value={value.phone} onChange={(e) => set("phone", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-email`}>Email</Label>
        <Input id={`${id}-email`} type="email" value={value.email} onChange={(e) => set("email", e.target.value)} />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={`${id}-street`}>Address</Label>
        <Input id={`${id}-street`} value={value.street} onChange={(e) => set("street", e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-city`}>City</Label>
        <Input
          id={`${id}-city`}
          value={value.city}
          list={`${id}-cities`}
          onChange={(e) => {
            const city = CITIES.find((c) => c.name === e.target.value);
            if (city) {
              onChange({
                ...value,
                city: city.name,
                state: city.state,
                postalCode: city.postal,
                country: city.country,
              });
            } else {
              set("city", e.target.value);
            }
          }}
          required
        />
        <datalist id={`${id}-cities`}>
          {CITIES.map((c) => (
            <option key={`${c.name}-${c.state}`} value={c.name} />
          ))}
        </datalist>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-state`}>State / region</Label>
        <Input id={`${id}-state`} value={value.state} onChange={(e) => set("state", e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-zip`}>ZIP / postal code</Label>
        <Input id={`${id}-zip`} value={value.postalCode} onChange={(e) => set("postalCode", e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-country`}>Country</Label>
        <NativeSelect
          id={`${id}-country`}
          value={value.country}
          onChange={(e) => set("country", e.target.value)}
        >
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}
