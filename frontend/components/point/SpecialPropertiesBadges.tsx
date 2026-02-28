import type { PointSpecialProperty } from '@/types/drupal';
import { Tag } from '@/components/ui/DesignSystem';

const PROPERTY_LABELS: Record<PointSpecialProperty, { label: string; variant: 'sage' | 'earth' | 'gold' | 'warm' | 'muted' }> = {
  yuan_source:       { label: 'Yuan-Source',      variant: 'gold' },
  luo_connecting:    { label: 'Luo-Connecting',   variant: 'earth' },
  xi_cleft:          { label: 'Xi-Cleft',         variant: 'sage' },
  command_point:     { label: 'Command Point',     variant: 'warm' },
  influential_point: { label: 'Influential Point', variant: 'gold' },
  five_element_wood: { label: 'Wood Point',       variant: 'sage' },
  five_element_fire: { label: 'Fire Point',       variant: 'warm' },
  five_element_earth:{ label: 'Earth Point',      variant: 'earth' },
  five_element_metal:{ label: 'Metal Point',      variant: 'muted' },
  five_element_water:{ label: 'Water Point',      variant: 'muted' },
  confluent_point:   { label: 'Confluent',        variant: 'sage' },
  alarm_mu:          { label: 'Front-Mu',         variant: 'earth' },
  back_shu:          { label: 'Back-Shu',         variant: 'earth' },
  window_of_sky:     { label: 'Window of Sky',    variant: 'gold' },
  sea_of_blood:      { label: 'Sea of Blood',     variant: 'warm' },
  lower_sea:         { label: 'Lower Sea',        variant: 'muted' },
};

interface Props {
  properties: PointSpecialProperty[];
  max?: number;
}

export function SpecialPropertiesBadges({ properties, max }: Props) {
  if (!properties || properties.length === 0) return null;
  const visible = max ? properties.slice(0, max) : properties;
  const overflow = max && properties.length > max ? properties.length - max : 0;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map(prop => {
        const cfg = PROPERTY_LABELS[prop];
        if (!cfg) return null;
        return (
          <Tag key={prop} variant={cfg.variant} size="sm">
            {cfg.label}
          </Tag>
        );
      })}
      {overflow > 0 && (
        <span className="text-xs text-earth-400 py-1">+{overflow} more</span>
      )}
    </div>
  );
}
