import React from 'react';
import { BeerSteinIcon } from 'phosphor-react-native/src/icons/BeerStein';
import { CalendarDotsIcon } from 'phosphor-react-native/src/icons/CalendarDots';
import { CalendarBlankIcon } from 'phosphor-react-native/src/icons/CalendarBlank';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { StarIcon } from 'phosphor-react-native/src/icons/Star';
import { GiftIcon } from 'phosphor-react-native/src/icons/Gift';
import { BellIcon } from 'phosphor-react-native/src/icons/Bell';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { EggIcon } from 'phosphor-react-native/src/icons/Egg';
import { BookmarkSimpleIcon } from 'phosphor-react-native/src/icons/BookmarkSimple';
import { ThumbsUpIcon } from 'phosphor-react-native/src/icons/ThumbsUp';
import { CameraIcon } from 'phosphor-react-native/src/icons/Camera';
import { TrophyIcon } from 'phosphor-react-native/src/icons/Trophy';
import { CrownIcon } from 'phosphor-react-native/src/icons/Crown';
import { MapPinIcon } from 'phosphor-react-native/src/icons/MapPin';
import { ArrowLeftIcon } from 'phosphor-react-native/src/icons/ArrowLeft';
import { CaretDownIcon } from 'phosphor-react-native/src/icons/CaretDown';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { HouseIcon } from 'phosphor-react-native/src/icons/House';
import { UserIcon } from 'phosphor-react-native/src/icons/User';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { FunnelSimpleIcon } from 'phosphor-react-native/src/icons/FunnelSimple';
import { HeartIcon } from 'phosphor-react-native/src/icons/Heart';
import { ClockIcon } from 'phosphor-react-native/src/icons/Clock';
import { PhoneIcon } from 'phosphor-react-native/src/icons/Phone';
import { GlobeSimpleIcon } from 'phosphor-react-native/src/icons/GlobeSimple';
import { NavigationArrowIcon } from 'phosphor-react-native/src/icons/NavigationArrow';
import { FlagIcon } from 'phosphor-react-native/src/icons/Flag';
import { ShieldCheckIcon } from 'phosphor-react-native/src/icons/ShieldCheck';
import { ListIcon } from 'phosphor-react-native/src/icons/List';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { MinusIcon } from 'phosphor-react-native/src/icons/Minus';
import { PaletteIcon } from 'phosphor-react-native/src/icons/Palette';
import { SignOutIcon } from 'phosphor-react-native/src/icons/SignOut';
import { WarningIcon } from 'phosphor-react-native/src/icons/Warning';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { ArrowRightIcon } from 'phosphor-react-native/src/icons/ArrowRight';
import { FireIcon } from 'phosphor-react-native/src/icons/Fire';
import { WineIcon } from 'phosphor-react-native/src/icons/Wine';
import { MartiniIcon } from 'phosphor-react-native/src/icons/Martini';
import { ForkKnifeIcon } from 'phosphor-react-native/src/icons/ForkKnife';
import { MusicNotesIcon } from 'phosphor-react-native/src/icons/MusicNotes';
import { SoccerBallIcon } from 'phosphor-react-native/src/icons/SoccerBall';
import { CrosshairIcon } from 'phosphor-react-native/src/icons/Crosshair';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { ConfettiIcon } from 'phosphor-react-native/src/icons/Confetti';
import { SparkleIcon } from 'phosphor-react-native/src/icons/Sparkle';
import { ArrowBendDownRightIcon } from 'phosphor-react-native/src/icons/ArrowBendDownRight';
import { MoonIcon } from 'phosphor-react-native/src/icons/Moon';
import { SunIcon } from 'phosphor-react-native/src/icons/Sun';
import { useTheme } from '../../theme';

export type IconRole = 'brand' | 'positive' | 'urgent' | 'discovery' | 'muted' | 'default';

export type IconName = keyof typeof IconMap;

export const IconMap = {
  deals: 'BeerStein',
  events: 'CalendarDots',
  calendarBlank: 'CalendarBlank',
  caretLeft: 'CaretLeft',
  points: 'Star',
  rewards: 'Gift',
  bell: 'Bell',
  submit: 'PencilSimple',
  correct: 'CheckCircle',
  remove: 'Trash',
  easter_egg: 'Egg',
  bookmark: 'BookmarkSimple',
  upvote: 'ThumbsUp',
  camera: 'Camera',
  trophy: 'Trophy',
  crown: 'Crown',
  location: 'MapPin',
  back: 'ArrowLeft',
  dropdown: 'CaretDown',
  chevronRight: 'CaretRight',
  home: 'House',
  profile: 'User',
  search: 'MagnifyingGlass',
  filter: 'FunnelSimple',
  heart: 'Heart',
  clock: 'Clock',
  phone: 'Phone',
  globe: 'GlobeSimple',
  directions: 'NavigationArrow',
  flag: 'Flag',
  shield: 'ShieldCheck',
  list: 'List',
  plus: 'Plus',
  minus: 'Minus',
  palette: 'Palette',
  logout: 'SignOut',
  warning: 'Warning',
  x: 'X',
  check: 'Check',
  arrowRight: 'ArrowRight',
  fire: 'Fire',
  wine: 'Wine',
  martini: 'Martini',
  food: 'ForkKnife',
  music: 'MusicNotes',
  sports: 'SoccerBall',
  crosshair: 'Crosshair',
  warningCircle: 'WarningCircle',
  confetti: 'Confetti',
  sparkle: 'Sparkle',
  arrowBendDownRight: 'ArrowBendDownRight',
  moon: 'Moon',
  sun: 'Sun',
} as const;

const PHOSPHOR_ICONS: Record<string, React.FC<any>> = {
  BeerStein: BeerSteinIcon,
  CalendarDots: CalendarDotsIcon,
  CalendarBlank: CalendarBlankIcon,
  CaretLeft: CaretLeftIcon,
  Star: StarIcon,
  Gift: GiftIcon,
  Bell: BellIcon,
  PencilSimple: PencilSimpleIcon,
  CheckCircle: CheckCircleIcon,
  Trash: TrashIcon,
  Egg: EggIcon,
  BookmarkSimple: BookmarkSimpleIcon,
  ThumbsUp: ThumbsUpIcon,
  Camera: CameraIcon,
  Trophy: TrophyIcon,
  Crown: CrownIcon,
  MapPin: MapPinIcon,
  ArrowLeft: ArrowLeftIcon,
  CaretDown: CaretDownIcon,
  CaretRight: CaretRightIcon,
  House: HouseIcon,
  User: UserIcon,
  MagnifyingGlass: MagnifyingGlassIcon,
  FunnelSimple: FunnelSimpleIcon,
  Heart: HeartIcon,
  Clock: ClockIcon,
  Phone: PhoneIcon,
  GlobeSimple: GlobeSimpleIcon,
  NavigationArrow: NavigationArrowIcon,
  Flag: FlagIcon,
  ShieldCheck: ShieldCheckIcon,
  List: ListIcon,
  Plus: PlusIcon,
  Minus: MinusIcon,
  Palette: PaletteIcon,
  SignOut: SignOutIcon,
  Warning: WarningIcon,
  X: XIcon,
  Check: CheckIcon,
  ArrowRight: ArrowRightIcon,
  Fire: FireIcon,
  Wine: WineIcon,
  Martini: MartiniIcon,
  ForkKnife: ForkKnifeIcon,
  MusicNotes: MusicNotesIcon,
  SoccerBall: SoccerBallIcon,
  Crosshair: CrosshairIcon,
  WarningCircle: WarningCircleIcon,
  Confetti: ConfettiIcon,
  Sparkle: SparkleIcon,
  ArrowBendDownRight: ArrowBendDownRightIcon,
  Moon: MoonIcon,
  Sun: SunIcon,
};

interface AppIconProps {
  name: IconName;
  size?: number;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  role?: IconRole;
  color?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({
  name,
  size = 20,
  weight,
  role = 'default',
  color,
}) => {
  const { theme } = useTheme();
  const d = theme.derived;

  const roleColors: Record<IconRole, string> = {
    brand: d.primary,
    positive: d.live,
    urgent: d.error,
    discovery: d.discovery,
    muted: d.textMuted,
    default: d.text,
  };

  const iconColor = color ?? roleColors[role];
  const iconWeight =
    weight ??
    (['deals', 'events', 'points', 'rewards', 'trophy', 'crown', 'home', 'profile'].includes(name)
      ? 'duotone'
      : 'regular');
  const IconComponent = PHOSPHOR_ICONS[IconMap[name]];

  if (!IconComponent) {
    return null;
  }

  return <IconComponent size={size} color={iconColor} weight={iconWeight} />;
};
