sed -i 's/export interface Product {/export interface GlobalOptionGroup {\n  id: string;\n  name: string;\n  type: UiSectionType;\n  title: string;\n  items?: string[];\n  extras?: ExtraAddition[];\n  chips?: string[];\n  min_selection?: number;\n  max_selection?: number;\n  options?: ComboGroupOption[];\n}\n\nexport interface Product {/' frontend/src/api/api.impl.ts
sed -i 's/ui_sections?: UiSection\[\];/ui_sections?: UiSection\[\];\n  global_group_ids?: string\[\];/' frontend/src/api/api.impl.ts
sed -i 's/orders: Order\[\]/orders: Order\[\]; global_groups: GlobalOptionGroup\[\]/' frontend/src/api/api.impl.ts
sed -i 's/orders: \[\],/orders: \[\],\n  global_groups: \[\],/' frontend/src/api/api.impl.ts
