-- ЦКР Этап 20: категории для реального наполнения closed beta
-- Идемпотентно: on conflict do nothing
-- Без реальных персональных данных

insert into public.categories (name, icon, slug) values
  ('Производство', 'factory', 'production'),
  ('Недвижимость', 'building', 'real-estate'),
  ('Сельское хозяйство', 'sprout', 'agriculture'),
  ('Туризм', 'map', 'tourism'),
  ('IT', 'cpu', 'it'),
  ('Торговля', 'store', 'trade'),
  ('Услуги', 'briefcase', 'services'),
  ('Энергетика', 'zap', 'energy')
on conflict (slug) do nothing;

insert into public.opportunity_categories (name, slug) values
  ('Земля', 'land'),
  ('Помещения', 'premises'),
  ('Оборудование', 'equipment'),
  ('Готовый бизнес', 'ready_business'),
  ('Технологии', 'technology'),
  ('Услуги', 'service'),
  ('Партнёры', 'partner')
on conflict (slug) do nothing;
