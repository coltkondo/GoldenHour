import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { submissionsAPI, authAPI, venuesAPI, dealsAPI } from '../api/endpoints';
import { POINTS_CONFIG, REWARDS_THRESHOLD, REWARDS_ENABLED } from '../config/constants';
import { AppIcon } from '../components/icons';
import { formatScheduleRange } from '../utils/scheduleUtils';
import type { Venue, Deal, HappyHourSchedule } from '../types/api';

/* ── Types ── */

type FormType = 'new_deal' | 'deal_issue' | 'bar_issue' | 'new_bar' | 'new_event';

const UI_DAYS = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];

function uiDayToDb(uiDay: number): number {
  return uiDay === 0 ? 6 : uiDay - 1;
}

const FORM_OPTIONS: { type: FormType; label: string; desc: string; pts: number }[] = [
  { type: 'new_deal',   label: 'New HH Deal',      desc: "Found a happy hour deal that's not listed?",       pts: POINTS_CONFIG.new_deal },
  { type: 'new_event',  label: 'Add Event',         desc: 'Know about an upcoming event at a bar?',          pts: POINTS_CONFIG.new_event },
  { type: 'deal_issue', label: 'Deal Info Wrong',   desc: 'Deal details are incorrect or no longer active?', pts: POINTS_CONFIG.deal_update },
  { type: 'bar_issue',  label: 'Bar Info Wrong',    desc: 'Bar details need updating or bar has closed?',    pts: POINTS_CONFIG.bar_update },
  { type: 'new_bar',    label: 'New Bar',           desc: 'Spotted a bar with happy hour not in the app?',   pts: POINTS_CONFIG.new_bar },
];

const DEAL_ISSUES = [
  { key: 'price_wrong',        label: 'Price is wrong' },
  { key: 'time_wrong',         label: 'Hours / time is wrong' },
  { key: 'days_wrong',         label: 'Days offered are wrong' },
  { key: 'description_wrong',  label: 'Description is wrong' },
  { key: 'no_longer_active',   label: 'Deal is no longer active' },
];

const BAR_ISSUES = [
  { key: 'name',       label: 'Bar name is wrong' },
  { key: 'address',    label: 'Address is wrong' },
  { key: 'phone',      label: 'Phone number is wrong' },
  { key: 'website',    label: 'Website is wrong' },
  { key: 'other',      label: 'Something else is wrong' },
  { key: 'bar_closed', label: 'Bar is permanently closed' },
];

/* ── Shared props ── */

interface SharedSubmitProps {
  d: any;
  onSubmit: (type: string, data: Record<string, any>, pts: number) => Promise<void>;
  submitting: boolean;
  submitError: string;
}

interface VenueFormProps extends SharedSubmitProps {
  venues: Venue[];
  venuesLoading: boolean;
}

/* ── Main Screen ── */

export const SubmitScreen = () => {
  const { theme } = useTheme();
  const d = theme.derived;
  const navigation = useNavigation<any>();
  const { user, refreshUser } = useAuth();

  const [formType, setFormType] = useState<FormType | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [lastPts, setLastPts] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      authAPI.me().then((u) => refreshUser(u)).catch(() => {});
      fetchVenues();
    }, [user?.id]),
  );

  const fetchVenues = async () => {
    if (!user) return;
    setVenuesLoading(true);
    try {
      const data = await venuesAPI.getAll({ limit: 200, market_slug: user.market_slug });
      setVenues(data.filter((v) => v.active).sort((a, b) => a.name.localeCompare(b.name)));
    } catch {
      // keep empty
    } finally {
      setVenuesLoading(false);
    }
  };

  const handleSubmit = async (type: string, data: Record<string, any>, pts: number) => {
    setSubmitting(true);
    setSubmitError('');
    try {
      await submissionsAPI.submit({ submission_type: type, submitted_data: data });
      setLastPts(pts);
      setSubmitted(true);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setSubmitError('Session expired — please log out and log back in.');
      } else {
        setSubmitError(err.response?.data?.detail || 'Submission failed — please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setFormType(null);
    setSubmitted(false);
    setSubmitError('');
    setLastPts(0);
  };

  const points = user?.points_balance ?? 0;
  const progress = Math.min(points / REWARDS_THRESHOLD, 1);
  const ptsToGo = Math.max(REWARDS_THRESHOLD - points, 0);

  /* Auth wall */
  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: d.background, padding: 32 }]}>
        <AppIcon name="plus" size={48} role="muted" />
        <Text style={[styles.wallTitle, { color: d.text }]}>Help Build the Map</Text>
        <Text style={[styles.wallSub, { color: d.textMuted }]}>
          Create a free account to submit happy hour deals.
        </Text>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: d.primary, width: '100%', marginTop: 16 }]}
          onPress={() => navigation.navigate('Signup')} activeOpacity={0.85}
        >
          <Text style={[styles.btnText, { color: d.buttonPrimaryText }]}>Sign Up — It's Free</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 16 }} onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.linkText, { color: d.primary }]}>Already have an account? Log in</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 28 }} onPress={() => navigation.navigate('HomeTab')}>
          <Text style={[styles.mutedText, { color: d.textMuted }]}>Just browsing — take me to deals</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* Success */
  if (submitted) {
    return (
      <View style={[styles.center, { backgroundColor: d.background, flex: 1, paddingHorizontal: 28 }]}>
        <View style={[styles.successCard, { backgroundColor: d.cardBackground, borderColor: d.border }]}>
          <AppIcon name="correct" size={52} role="positive" />
          <Text style={[styles.successTitle, { color: d.text }]}>Submitted!</Text>
          <Text style={[styles.wallSub, { color: d.textMuted }]}>
            Thanks for helping keep GLDNHR accurate. We'll review it shortly.
          </Text>
          {REWARDS_ENABLED && lastPts > 0 && (
            <View style={[styles.ptsBadge, { backgroundColor: 'rgba(245,166,35,0.12)', borderColor: d.primary }]}>
              <AppIcon name="points" size={14} role="brand" />
              <Text style={[styles.ptsBadgeText, { color: d.primary }]}>+{lastPts} pts when approved</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: d.primary, width: '100%', marginTop: 20 }]}
          onPress={reset}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnText, { color: d.buttonPrimaryText }]}>Submit Another</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 16 }} onPress={() => navigation.navigate('MySubmissions')}>
          <Text style={[styles.linkText, { color: d.primary }]}>View My Submissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* Option list */
  if (!formType) {
    return (
      <View style={[styles.container, { backgroundColor: d.background }]}>
        <ScrollView contentContainerStyle={styles.optionContent} showsVerticalScrollIndicator={false}>
          {REWARDS_ENABLED && (
            <View style={[styles.progressCard, { backgroundColor: d.cardBackground, borderColor: d.border }]}>
              <View style={styles.progressHeader}>
                <View style={styles.progressLeft}>
                  <AppIcon name="points" size={18} role="brand" />
                  <Text style={[styles.progressPts, { color: d.primary }]}>{points.toLocaleString()}</Text>
                  <Text style={[styles.progressLabel, { color: d.textMuted }]}>/ {REWARDS_THRESHOLD.toLocaleString()} pts</Text>
                </View>
                <AppIcon name="rewards" size={20} role={progress >= 1 ? 'brand' : 'muted'} />
              </View>
              <View style={[styles.progressTrack, { backgroundColor: d.filterInactive }]}>
                <View style={[styles.progressFill, { backgroundColor: d.primary, width: `${Math.max(progress * 100, 2)}%` }]} />
              </View>
              <Text style={[styles.progressHint, { color: d.textMuted }]}>
                {progress >= 1 ? "You've earned a reward!" : `${ptsToGo.toLocaleString()} pts to your next $20 reward`}
              </Text>
            </View>
          )}

          <Text style={[styles.prompt, { color: d.text }]}>What did you find?</Text>

          {FORM_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.type}
              style={[styles.optionCard, { backgroundColor: d.cardBackground, borderColor: d.border }]}
              onPress={() => setFormType(opt.type)}
              activeOpacity={0.8}
            >
              <View style={styles.optionBody}>
                <Text style={[styles.optionLabel, { color: d.text }]}>{opt.label}</Text>
                <Text style={[styles.optionDesc, { color: d.textMuted }]}>{opt.desc}</Text>
              </View>
              <View style={styles.optionRight}>
                {REWARDS_ENABLED && (
                  <View style={[styles.ptsPill, { backgroundColor: 'rgba(245,166,35,0.10)', borderColor: d.primary }]}>
                    <Text style={[styles.ptsPillText, { color: d.primary }]}>+{opt.pts}</Text>
                  </View>
                )}
                <AppIcon name="chevronRight" size={16} role="muted" />
              </View>
            </TouchableOpacity>
          ))}

          <View style={{ height: 120 }} />
        </ScrollView>
      </View>
    );
  }

  /* Active form */
  const formLabel = FORM_OPTIONS.find((o) => o.type === formType)?.label ?? '';

  return (
    <View style={[styles.container, { backgroundColor: d.background }]}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backBtn} onPress={reset} activeOpacity={0.7}>
            <AppIcon name="back" size={18} role="muted" />
            <Text style={[styles.backBtnText, { color: d.textMuted }]}>Back</Text>
          </TouchableOpacity>

          <Text style={[styles.formTitle, { color: d.text }]}>{formLabel}</Text>

          {formType === 'new_deal' && (
            <NewHHDealForm
              d={d} venues={venues} venuesLoading={venuesLoading}
              onSubmit={handleSubmit} submitting={submitting} submitError={submitError}
            />
          )}
          {formType === 'deal_issue' && (
            <DealIssueForm
              d={d} venues={venues} venuesLoading={venuesLoading}
              onSubmit={handleSubmit} submitting={submitting} submitError={submitError}
            />
          )}
          {formType === 'bar_issue' && (
            <BarIssueForm
              d={d} venues={venues} venuesLoading={venuesLoading}
              onSubmit={handleSubmit} submitting={submitting} submitError={submitError}
            />
          )}
          {formType === 'new_bar' && (
            <NewBarForm
              d={d} venues={[]} venuesLoading={false}
              onSubmit={handleSubmit} submitting={submitting} submitError={submitError}
            />
          )}
          {formType === 'new_event' && (
            <NewEventForm
              d={d} venues={venues} venuesLoading={venuesLoading}
              onSubmit={handleSubmit} submitting={submitting} submitError={submitError}
            />
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

/* ── Shared field components ── */

const FieldLabel: React.FC<{ text: string; d: any }> = ({ text, d }) => (
  <Text style={[styles.fieldLabel, { color: d.text }]}>{text}</Text>
);

/* Inline venue dropdown */
const VenueSelector: React.FC<{
  venues: Venue[];
  loading: boolean;
  selected: Venue | null;
  onSelect: (v: Venue) => void;
  d: any;
}> = ({ venues, loading, selected, onSelect, d }) => {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity
        style={[styles.selectorBtn, { backgroundColor: d.cardBackground, borderColor: open ? d.primary : d.border }]}
        onPress={() => setOpen((o) => !o)}
        activeOpacity={0.8}
      >
        {loading && <ActivityIndicator size="small" color={d.primary} style={{ marginRight: 8 }} />}
        <Text style={[styles.selectorBtnText, { color: selected ? d.text : d.textHint, flex: 1 }]} numberOfLines={1}>
          {selected ? selected.name : 'Select bar...'}
        </Text>
        <AppIcon name="dropdown" size={16} role="muted" />
      </TouchableOpacity>

      {open && (
        <View style={[styles.selectorList, { backgroundColor: d.cardBackground, borderColor: d.primary }]}>
          <ScrollView style={{ maxHeight: 260 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {venues.map((v, i) => (
              <TouchableOpacity
                key={v.id}
                style={[
                  styles.selectorItem,
                  i < venues.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: d.divider },
                  selected?.id === v.id && { backgroundColor: 'rgba(245,166,35,0.08)' },
                ]}
                onPress={() => { onSelect(v); setOpen(false); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.selectorItemName, { color: selected?.id === v.id ? d.primary : d.text }]}>
                  {v.name}
                </Text>
                {v.neighborhood ? (
                  <Text style={[styles.selectorItemSub, { color: d.textMuted }]}>{v.neighborhood}</Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

/* Day pills — multi-select */
const DayPicker: React.FC<{ selected: number[]; onToggle: (i: number) => void; d: any }> = ({ selected, onToggle, d }) => (
  <View style={styles.dayRow}>
    {UI_DAYS.map((label, i) => {
      const active = selected.includes(i);
      return (
        <TouchableOpacity
          key={i}
          style={[styles.dayPill, {
            backgroundColor: active ? 'rgba(245,166,35,0.12)' : d.filterInactive,
            borderColor: active ? d.primary : 'transparent',
            borderWidth: 1,
          }]}
          onPress={() => onToggle(i)} activeOpacity={0.7}
        >
          <Text style={[styles.dayPillText, { color: active ? d.primary : d.textMuted }]}>{label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

/* Day pills — single select */
const SingleDayPicker: React.FC<{ selected: number | null; onSelect: (i: number) => void; d: any }> = ({ selected, onSelect, d }) => (
  <View style={styles.dayRow}>
    {UI_DAYS.map((label, i) => {
      const active = selected === i;
      return (
        <TouchableOpacity
          key={i}
          style={[styles.dayPill, {
            backgroundColor: active ? 'rgba(245,166,35,0.12)' : d.filterInactive,
            borderColor: active ? d.primary : 'transparent',
            borderWidth: 1,
          }]}
          onPress={() => onSelect(i)} activeOpacity={0.7}
        >
          <Text style={[styles.dayPillText, { color: active ? d.primary : d.textMuted }]}>{label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

/* Single time slot input */
const TimePicker: React.FC<{
  label: string;
  hour: string; minute: string; isAm: boolean;
  onHour: (v: string) => void; onMin: (v: string) => void; onToggleAmPm: () => void;
  d: any;
}> = ({ label, hour, minute, isAm, onHour, onMin, onToggleAmPm, d }) => (
  <View style={styles.timeCol}>
    <Text style={[styles.timeColLabel, { color: d.textMuted }]}>{label}</Text>
    <View style={styles.timeRow}>
      <TextInput
        style={[styles.timeBox, { color: d.text, backgroundColor: d.cardBackground, borderColor: d.border }]}
        value={hour} onChangeText={(v) => onHour(v.replace(/\D/g, '').slice(0, 2))}
        keyboardType="number-pad" placeholder="4" placeholderTextColor={d.textHint}
        maxLength={2} textAlign="center"
      />
      <Text style={[styles.timeColon, { color: d.textMuted }]}>:</Text>
      <TextInput
        style={[styles.timeBox, { color: d.text, backgroundColor: d.cardBackground, borderColor: d.border }]}
        value={minute} onChangeText={(v) => onMin(v.replace(/\D/g, '').slice(0, 2))}
        keyboardType="number-pad" placeholder="00" placeholderTextColor={d.textHint}
        maxLength={2} textAlign="center"
      />
      <TouchableOpacity
        style={[styles.ampmBtn, { backgroundColor: d.cardBackground, borderColor: d.border }]}
        onPress={onToggleAmPm} activeOpacity={0.7}
      >
        <Text style={[styles.ampmText, { color: d.primary }]}>{isAm ? 'AM' : 'PM'}</Text>
      </TouchableOpacity>
    </View>
  </View>
);

/* Issue option row */
const IssueOption: React.FC<{
  label: string; active: boolean; danger?: boolean;
  onPress: () => void; d: any;
}> = ({ label, active, danger, onPress, d }) => {
  const activeColor = danger ? d.error : d.primary;
  return (
    <TouchableOpacity
      style={[styles.issueBtn, {
        backgroundColor: active ? (danger ? 'rgba(239,68,68,0.08)' : 'rgba(245,166,35,0.10)') : d.cardBackground,
        borderColor: active ? activeColor : d.border,
      }]}
      onPress={onPress} activeOpacity={0.8}
    >
      <Text style={[styles.issueBtnText, { color: active ? activeColor : d.text }]}>{label}</Text>
    </TouchableOpacity>
  );
};

/* ── New HH Deal ── */

const NewHHDealForm: React.FC<VenueFormProps> = ({ d, venues, venuesLoading, onSubmit, submitting, submitError }) => {
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [title, setTitle] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [isAllDay, setIsAllDay] = useState<boolean | null>(null);
  const [startHour, setStartHour] = useState('');
  const [startMin, setStartMin] = useState('');
  const [startAm, setStartAm] = useState(false);
  const [endHour, setEndHour] = useState('');
  const [endMin, setEndMin] = useState('');
  const [endAm, setEndAm] = useState(false);
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  const toggleDay = (i: number) =>
    setSelectedDays((prev) => prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]);

  const toTime24 = (h: string, m: string, am: boolean) => {
    const hour = parseInt(h || '0', 10);
    const min = parseInt(m || '0', 10);
    const h24 = am ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
    return `${String(h24).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    setError('');
    if (!selectedVenue) { setError('Please select a bar.'); return; }
    if (!title.trim()) { setError('Please enter a deal description.'); return; }
    if (selectedDays.length === 0) { setError('Please select at least one day.'); return; }
    if (isAllDay === null) { setError('Please indicate if this is an all-day deal.'); return; }
    if (!isAllDay && (!startHour.trim() || !endHour.trim())) {
      setError('Please enter start and end times.'); return;
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    await onSubmit('new_deal', {
      bar_id: selectedVenue.id,
      bar_name: selectedVenue.name,
      title: title.trim(),
      days: selectedDays.sort().map((i) => dayNames[i]),
      is_all_day: isAllDay,
      start_time: isAllDay ? null : toTime24(startHour, startMin, startAm),
      end_time: isAllDay ? null : toTime24(endHour, endMin, endAm),
      price_note: price.trim() || null,
    }, POINTS_CONFIG.new_deal);
  };

  return (
    <View style={styles.formGap}>
      <FieldLabel d={d} text="Which bar?" />
      <VenueSelector venues={venues} loading={venuesLoading} selected={selectedVenue} onSelect={setSelectedVenue} d={d} />

      <FieldLabel d={d} text="Deal description *" />
      <TextInput
        style={[styles.textInput, { color: d.text, backgroundColor: d.cardBackground, borderColor: d.border }]}
        value={title} onChangeText={setTitle}
        placeholder="e.g. $3 draft beer, half-off appetizers"
        placeholderTextColor={d.textHint}
      />

      <FieldLabel d={d} text="Day(s) of the week" />
      <DayPicker selected={selectedDays} onToggle={toggleDay} d={d} />

      <FieldLabel d={d} text="All day?" />
      <View style={styles.boolRow}>
        {[true, false].map((val) => (
          <TouchableOpacity
            key={String(val)}
            style={[styles.boolBtn, {
              backgroundColor: isAllDay === val ? 'rgba(245,166,35,0.12)' : d.filterInactive,
              borderColor: isAllDay === val ? d.primary : 'transparent',
              borderWidth: 1,
            }]}
            onPress={() => setIsAllDay(val)} activeOpacity={0.7}
          >
            <Text style={[styles.boolBtnText, { color: isAllDay === val ? d.primary : d.textMuted }]}>
              {val ? 'Yes' : 'No'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isAllDay === false && (
        <>
          <FieldLabel d={d} text="Time range" />
          <View style={styles.timeRangeRow}>
            <TimePicker
              label="Start" hour={startHour} minute={startMin} isAm={startAm}
              onHour={setStartHour} onMin={setStartMin} onToggleAmPm={() => setStartAm((a) => !a)} d={d}
            />
            <Text style={[styles.timeRangeDash, { color: d.textMuted }]}>—</Text>
            <TimePicker
              label="End" hour={endHour} minute={endMin} isAm={endAm}
              onHour={setEndHour} onMin={setEndMin} onToggleAmPm={() => setEndAm((a) => !a)} d={d}
            />
          </View>
        </>
      )}

      <FieldLabel d={d} text="Price (optional)" />
      <View style={[styles.priceRow, { backgroundColor: d.cardBackground, borderColor: d.border }]}>
        <Text style={[styles.priceDollar, { color: d.textMuted }]}>$</Text>
        <TextInput
          style={[styles.priceInput, { color: d.text }]}
          value={price} onChangeText={(v) => setPrice(v.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={d.textHint}
        />
      </View>

      {(error || submitError) ? <Text style={[styles.errorText, { color: d.error }]}>{error || submitError}</Text> : null}

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: d.primary }, submitting && { opacity: 0.7 }]}
        onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}
      >
        {submitting ? <ActivityIndicator color={d.buttonPrimaryText} /> :
          <Text style={[styles.btnText, { color: d.buttonPrimaryText }]}>
            {REWARDS_ENABLED ? `Submit — Earn ${POINTS_CONFIG.new_deal} pts` : 'Submit'}
          </Text>}
      </TouchableOpacity>
    </View>
  );
};

/* ── Deal Issue (multi-step progressive) ── */

const DealIssueForm: React.FC<VenueFormProps> = ({ d, venues, venuesLoading, onSubmit, submitting, submitError }) => {
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [schedules, setSchedules] = useState<HappyHourSchedule[]>([]);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [correction, setCorrection] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedVenue) return;
    setSelectedDay(null);
    setSelectedDeal(null);
    setSelectedIssue(null);
    setDealsLoading(true);
    Promise.all([
      dealsAPI.getByVenue(selectedVenue.id),
      venuesAPI.getSchedules(selectedVenue.id),
    ])
      .then(([d, s]) => { setDeals(d); setSchedules(s); })
      .catch(() => {})
      .finally(() => setDealsLoading(false));
  }, [selectedVenue?.id]);

  const dealsForDay = useMemo(() => {
    if (selectedDay === null || deals.length === 0) return [];
    const dbDay = uiDayToDb(selectedDay);
    const dayScheds = schedules.filter((s) => s.day_of_week === dbDay);
    const scheduledIds = new Set(dayScheds.flatMap((s) => s.deal_ids ?? []));
    const hasAnySchedule = (dealId: string) => schedules.some((s) => (s.deal_ids ?? []).includes(dealId));
    return [
      ...deals.filter((d) => scheduledIds.has(d.id)),
      ...deals.filter((d) => !hasAnySchedule(d.id)),
    ];
  }, [deals, schedules, selectedDay]);

  const timeLabel = (deal: Deal): string => {
    if (selectedDay === null) return '';
    const dbDay = uiDayToDb(selectedDay);
    const sched = schedules.find((s) => s.day_of_week === dbDay && (s.deal_ids ?? []).includes(deal.id));
    return sched ? formatScheduleRange(sched.start_time, sched.end_time, 'Schedule varies') : 'Schedule varies';
  };

  const handleSubmit = async () => {
    setError('');
    if (!selectedVenue) { setError('Please select a bar.'); return; }
    if (selectedDay === null) { setError('Please select a day.'); return; }
    if (!selectedDeal) { setError('Please select a deal.'); return; }
    if (!selectedIssue) { setError("Please select what's wrong."); return; }
    if (selectedIssue !== 'no_longer_active' && !correction.trim()) {
      setError('Please describe the correction.'); return;
    }
    const type = selectedIssue === 'no_longer_active' ? 'deal_expired' : 'deal_update';
    const pts = selectedIssue === 'no_longer_active' ? POINTS_CONFIG.deal_expired : POINTS_CONFIG.deal_update;
    await onSubmit(type, {
      bar_id: selectedVenue.id,
      bar_name: selectedVenue.name,
      deal_id: selectedDeal.id,
      deal_title: selectedDeal.title,
      issue_type: selectedIssue,
      correction: selectedIssue !== 'no_longer_active' ? correction.trim() : null,
    }, pts);
  };

  return (
    <View style={styles.formGap}>
      <FieldLabel d={d} text="Which bar?" />
      <VenueSelector venues={venues} loading={venuesLoading} selected={selectedVenue} onSelect={setSelectedVenue} d={d} />

      {selectedVenue && (
        <>
          <FieldLabel d={d} text="Which day is the deal on?" />
          <SingleDayPicker
            selected={selectedDay}
            onSelect={(day) => { setSelectedDay(day); setSelectedDeal(null); setSelectedIssue(null); }}
            d={d}
          />
        </>
      )}

      {selectedVenue && selectedDay !== null && (
        <>
          <FieldLabel d={d} text="Which deal is wrong?" />
          {dealsLoading ? (
            <ActivityIndicator color={d.primary} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
          ) : dealsForDay.length === 0 ? (
            <Text style={[styles.emptyNote, { color: d.textMuted }]}>
              No deals found for this day — try selecting a different day.
            </Text>
          ) : (
            <View style={[styles.dealList, { borderColor: d.border }]}>
              {dealsForDay.map((deal, i) => (
                <TouchableOpacity
                  key={deal.id}
                  style={[
                    styles.dealRow,
                    i < dealsForDay.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: d.divider },
                    selectedDeal?.id === deal.id && { backgroundColor: 'rgba(245,166,35,0.08)' },
                  ]}
                  onPress={() => { setSelectedDeal(deal); setSelectedIssue(null); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dealRowTitle, { color: selectedDeal?.id === deal.id ? d.primary : d.text }]}>
                    {deal.title}
                  </Text>
                  <Text style={[styles.dealRowSub, { color: d.textMuted }]}>{timeLabel(deal)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}

      {selectedDeal && (
        <>
          <FieldLabel d={d} text="What's wrong?" />
          {DEAL_ISSUES.map((issue) => (
            <IssueOption
              key={issue.key} label={issue.label}
              active={selectedIssue === issue.key}
              danger={issue.key === 'no_longer_active'}
              onPress={() => { setSelectedIssue(issue.key); setCorrection(''); }} d={d}
            />
          ))}
        </>
      )}

      {selectedIssue && selectedIssue !== 'no_longer_active' && (
        <>
          <FieldLabel d={d} text="What should it say?" />
          <TextInput
            style={[styles.textArea, { color: d.text, backgroundColor: d.cardBackground, borderColor: d.border }]}
            value={correction} onChangeText={setCorrection}
            placeholder="Describe the correct information..."
            placeholderTextColor={d.textHint}
            multiline numberOfLines={3} textAlignVertical="top"
          />
        </>
      )}

      {selectedIssue && (
        <>
          {(error || submitError) ? <Text style={[styles.errorText, { color: d.error }]}>{error || submitError}</Text> : null}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: d.primary }, submitting && { opacity: 0.7 }]}
            onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}
          >
            {submitting ? <ActivityIndicator color={d.buttonPrimaryText} /> :
              <Text style={[styles.btnText, { color: d.buttonPrimaryText }]}>
                {REWARDS_ENABLED
                  ? `Submit — Earn ${selectedIssue === 'no_longer_active' ? POINTS_CONFIG.deal_expired : POINTS_CONFIG.deal_update} pts`
                  : 'Submit'}
              </Text>}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

/* ── Bar Issue ── */

const BarIssueForm: React.FC<VenueFormProps> = ({ d, venues, venuesLoading, onSubmit, submitting, submitError }) => {
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [correction, setCorrection] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!selectedVenue) { setError('Please select a bar.'); return; }
    if (!selectedIssue) { setError("Please select what's wrong."); return; }
    if (selectedIssue !== 'bar_closed' && !correction.trim()) {
      setError('Please describe the correction.'); return;
    }
    const type = selectedIssue === 'bar_closed' ? 'bar_closed' : 'bar_update';
    const pts = selectedIssue === 'bar_closed' ? POINTS_CONFIG.bar_closed : POINTS_CONFIG.bar_update;
    await onSubmit(type, {
      bar_id: selectedVenue.id,
      bar_name: selectedVenue.name,
      issue_type: selectedIssue,
      correction: selectedIssue !== 'bar_closed' ? correction.trim() : null,
    }, pts);
  };

  return (
    <View style={styles.formGap}>
      <FieldLabel d={d} text="Which bar?" />
      <VenueSelector
        venues={venues} loading={venuesLoading} selected={selectedVenue}
        onSelect={(v) => { setSelectedVenue(v); setSelectedIssue(null); setCorrection(''); }} d={d}
      />

      {selectedVenue && (
        <>
          <View style={[styles.barInfoCard, { backgroundColor: d.cardBackground, borderColor: d.border }]}>
            <Text style={[styles.barInfoName, { color: d.text }]}>{selectedVenue.name}</Text>
            {selectedVenue.address ? <Text style={[styles.barInfoLine, { color: d.textMuted }]}>{selectedVenue.address}</Text> : null}
            {selectedVenue.phone ? <Text style={[styles.barInfoLine, { color: d.textMuted }]}>{selectedVenue.phone}</Text> : null}
            {selectedVenue.website ? <Text style={[styles.barInfoLine, { color: d.textMuted }]}>{selectedVenue.website}</Text> : null}
          </View>

          <FieldLabel d={d} text="What's wrong?" />
          {BAR_ISSUES.map((issue) => (
            <IssueOption
              key={issue.key} label={issue.label}
              active={selectedIssue === issue.key}
              danger={issue.key === 'bar_closed'}
              onPress={() => { setSelectedIssue(issue.key); setCorrection(''); }} d={d}
            />
          ))}
        </>
      )}

      {selectedIssue && selectedIssue !== 'bar_closed' && (
        <>
          <FieldLabel d={d} text="What should it say?" />
          <TextInput
            style={[styles.textArea, { color: d.text, backgroundColor: d.cardBackground, borderColor: d.border }]}
            value={correction} onChangeText={setCorrection}
            placeholder="Describe the correct information..."
            placeholderTextColor={d.textHint}
            multiline numberOfLines={3} textAlignVertical="top"
          />
        </>
      )}

      {selectedIssue && (
        <>
          {(error || submitError) ? <Text style={[styles.errorText, { color: d.error }]}>{error || submitError}</Text> : null}
          <TouchableOpacity
            style={[styles.btn, {
              backgroundColor: selectedIssue === 'bar_closed' ? d.error : d.primary,
            }, submitting && { opacity: 0.7 }]}
            onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}
          >
            {submitting ? <ActivityIndicator color={d.buttonPrimaryText} /> :
              <Text style={[styles.btnText, { color: d.buttonPrimaryText }]}>
                {selectedIssue === 'bar_closed' ? 'Report Bar Closed' :
                  REWARDS_ENABLED ? `Submit — Earn ${POINTS_CONFIG.bar_update} pts` : 'Submit'}
              </Text>}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

/* ── New Bar ── */

const NewBarForm: React.FC<VenueFormProps> = ({ d, onSubmit, submitting, submitError }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const useMyLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location needed', 'Enable location to use your current position.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      const geo = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      if (geo[0]) {
        const g = geo[0];
        setAddress([g.streetNumber, g.street, g.city, g.region].filter(Boolean).join(', '));
      }
    } catch {
      Alert.alert('Error', 'Could not get your location. Enter the address manually.');
    } finally {
      setLocLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!name.trim()) { setError('Please enter the bar name.'); return; }
    if (!address.trim()) { setError('Please enter the address.'); return; }
    if (!description.trim()) { setError('Please describe at least one deal or special.'); return; }
    await onSubmit('new_bar', {
      name: name.trim(),
      address: address.trim(),
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      description: description.trim(),
    }, POINTS_CONFIG.new_bar);
  };

  return (
    <View style={styles.formGap}>
      <FieldLabel d={d} text="Bar name *" />
      <TextInput
        style={[styles.textInput, { color: d.text, backgroundColor: d.cardBackground, borderColor: d.border }]}
        value={name} onChangeText={setName}
        placeholder="e.g. Spider Kelly's"
        placeholderTextColor={d.textHint}
      />

      <FieldLabel d={d} text="Address *" />
      <TouchableOpacity
        style={[styles.locationBtn, { backgroundColor: d.filterInactive }]}
        onPress={useMyLocation} disabled={locLoading} activeOpacity={0.8}
      >
        {locLoading
          ? <ActivityIndicator size="small" color={d.primary} />
          : <AppIcon name="location" size={16} role="brand" />}
        <Text style={[styles.locationBtnText, { color: d.primary }]}>
          {locLoading ? 'Getting location...' : 'Use My Location'}
        </Text>
      </TouchableOpacity>
      <TextInput
        style={[styles.textInput, { color: d.text, backgroundColor: d.cardBackground, borderColor: d.border }]}
        value={address} onChangeText={(v) => { setAddress(v); setCoords(null); }}
        placeholder="Street address, City, State"
        placeholderTextColor={d.textHint}
      />

      <FieldLabel d={d} text="Describe a deal *" />
      <Text style={[styles.fieldHint, { color: d.textMuted }]}>
        Tell us about at least one happy hour special so we can verify the bar.
      </Text>
      <TextInput
        style={[styles.textArea, { color: d.text, backgroundColor: d.cardBackground, borderColor: d.border }]}
        value={description} onChangeText={setDescription}
        placeholder="e.g. $3 drafts and half-off apps Mon–Fri 4–7pm"
        placeholderTextColor={d.textHint}
        multiline numberOfLines={4} textAlignVertical="top"
      />

      {(error || submitError) ? <Text style={[styles.errorText, { color: d.error }]}>{error || submitError}</Text> : null}

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: d.primary }, submitting && { opacity: 0.7 }]}
        onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}
      >
        {submitting ? <ActivityIndicator color={d.buttonPrimaryText} /> :
          <Text style={[styles.btnText, { color: d.buttonPrimaryText }]}>
            {REWARDS_ENABLED ? `Submit — Earn ${POINTS_CONFIG.new_bar} pts` : 'Submit'}
          </Text>}
      </TouchableOpacity>
    </View>
  );
};

/* ── New Event ── */

const EVENT_TYPES = ['Trivia', 'Karaoke', 'Watch Party', 'Comedy', 'Other'];

type RecurrenceType = 'once' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

const RECURRENCE_TYPES: { key: RecurrenceType; label: string }[] = [
  { key: 'once',     label: 'One Time' },
  { key: 'weekly',   label: 'Weekly' },
  { key: 'biweekly', label: 'Biweekly' },
  { key: 'monthly',  label: 'Monthly' },
  { key: 'custom',   label: 'Custom' },
];

const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const NewEventForm: React.FC<VenueFormProps> = ({ d, venues, venuesLoading, onSubmit, submitting, submitError }) => {
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [name, setName] = useState('');
  const [eventType, setEventType] = useState('');
  const [customEventType, setCustomEventType] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);      // weekly multi-select
  const [selectedDay, setSelectedDay] = useState<number | null>(null); // biweekly single-select
  const [dayOfMonth, setDayOfMonth] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [startHour, setStartHour] = useState('');
  const [startMin, setStartMin] = useState('');
  const [startAm, setStartAm] = useState(false); // default PM
  const [endHour, setEndHour] = useState('');
  const [endMin, setEndMin] = useState('');
  const [endAm, setEndAm] = useState(false); // default PM
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const toggleDay = (i: number) =>
    setSelectedDays((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);

  const resolvedEventType = eventType === 'Other' ? customEventType.trim() : eventType;

  const toTime24 = (h: string, m: string, am: boolean) => {
    const hour = parseInt(h || '0', 10);
    const min = parseInt(m || '0', 10);
    const h24 = am ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
    return `${String(h24).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };

  const formatDate = (d: Date) => {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${m}/${day}/${d.getFullYear()}`;
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) setDate(selectedDate);
  };

  const handleSubmit = async () => {
    setError('');
    if (!selectedVenue) { setError('Please select a bar.'); return; }
    if (!name.trim()) { setError('Please enter the event name.'); return; }
    if (eventType === 'Other' && !customEventType.trim()) { setError('Please describe the event type.'); return; }
    if (!recurrenceType) { setError('Please select how often this event happens.'); return; }
    if (!startHour.trim()) { setError('Please enter a start time.'); return; }

    if (recurrenceType === 'once' || recurrenceType === 'custom') {
      if (!date) { setError('Please select the event date.'); return; }
    }
    if (recurrenceType === 'weekly' && selectedDays.length === 0) {
      setError('Please select at least one day.'); return;
    }
    if (recurrenceType === 'biweekly' && selectedDay === null) {
      setError('Please select the day of week.'); return;
    }
    if (recurrenceType === 'monthly') {
      const dom = parseInt(dayOfMonth, 10);
      if (!dayOfMonth || isNaN(dom) || dom < 1 || dom > 28) {
        setError('Please enter a valid day of month (1–28).'); return;
      }
    }

    const payload: Record<string, any> = {
      bar_id: selectedVenue.id,
      bar_name: selectedVenue.name,
      event_name: name.trim(),
      event_type: resolvedEventType || null,
      recurrence_type: recurrenceType,
      start_time: toTime24(startHour, startMin, startAm),
      end_time: endHour.trim() ? toTime24(endHour, endMin, endAm) : null,
      description: description.trim() || null,
    };

    if (recurrenceType === 'once' || recurrenceType === 'custom') {
      payload.event_date = formatDate(date!);
    }
    if (recurrenceType === 'weekly') {
      payload.days = selectedDays.slice().sort().map((i) => DAY_NAMES_FULL[i]);
    }
    if (recurrenceType === 'biweekly') {
      payload.days = [DAY_NAMES_FULL[selectedDay!]];
    }
    if (recurrenceType === 'monthly') {
      payload.day_of_month = parseInt(dayOfMonth, 10);
    }
    if (recurrenceType === 'custom' && notes.trim()) {
      payload.notes = notes.trim();
    }

    await onSubmit('new_event', payload, POINTS_CONFIG.new_event);
  };

  return (
    <View style={styles.formGap}>
      <FieldLabel d={d} text="Which bar? *" />
      <VenueSelector venues={venues} loading={venuesLoading} selected={selectedVenue} onSelect={setSelectedVenue} d={d} />

      <FieldLabel d={d} text="Event name *" />
      <TextInput
        style={[styles.textInput, { color: d.text, backgroundColor: d.cardBackground, borderColor: d.border }]}
        value={name} onChangeText={setName}
        placeholder="e.g. Monday Night Trivia"
        placeholderTextColor={d.textHint}
      />

      <FieldLabel d={d} text="Event type" />
      <View style={[styles.dayRow, { flexWrap: 'wrap' }]}>
        {EVENT_TYPES.map((t) => {
          const active = eventType === t;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.recurrencePill, {
                backgroundColor: active ? 'rgba(167,139,250,0.12)' : d.filterInactive,
                borderColor: active ? '#a78bfa' : 'transparent',
                borderWidth: 1,
              }]}
              onPress={() => { setEventType(active ? '' : t); setCustomEventType(''); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayPillText, { color: active ? '#a78bfa' : d.textMuted }]}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {eventType === 'Other' && (
        <TextInput
          style={[styles.textInput, { color: d.text, backgroundColor: d.cardBackground, borderColor: d.border }]}
          value={customEventType} onChangeText={setCustomEventType}
          placeholder="e.g. Poker Night, Paint & Sip..."
          placeholderTextColor={d.textHint} autoFocus
        />
      )}

      <FieldLabel d={d} text="How often? *" />
      <View style={[styles.dayRow, { flexWrap: 'wrap' }]}>
        {RECURRENCE_TYPES.map((rt) => {
          const active = recurrenceType === rt.key;
          return (
            <TouchableOpacity
              key={rt.key}
              style={[styles.recurrencePill, {
                backgroundColor: active ? 'rgba(167,139,250,0.12)' : d.filterInactive,
                borderColor: active ? '#a78bfa' : 'transparent',
                borderWidth: 1,
              }]}
              onPress={() => setRecurrenceType(rt.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayPillText, { color: active ? '#a78bfa' : d.textMuted }]}>{rt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* One Time / Custom — date input */}
      {(recurrenceType === 'once' || recurrenceType === 'custom') && (
        <>
          <FieldLabel d={d} text={recurrenceType === 'custom' ? 'First occurrence date *' : 'Date *'} />
          <TouchableOpacity
            style={[styles.selectorBtn, { backgroundColor: d.cardBackground, borderColor: showDatePicker ? d.primary : d.border }]}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.selectorBtnText, { color: date ? d.text : d.textHint, flex: 1 }]} numberOfLines={1}>
              {date ? formatDate(date) : 'Select date...'}
            </Text>
            <AppIcon name="calendarBlank" size={16} role="muted" />
          </TouchableOpacity>
          {showDatePicker && (
            <>
              <DateTimePicker
                value={date ?? new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={[styles.dateDoneBtn, { backgroundColor: 'rgba(167,139,250,0.12)' }]}
                  onPress={() => setShowDatePicker(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dateDoneText, { color: d.primary }]}>Done</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </>
      )}

      {/* Custom — free-text notes */}
      {recurrenceType === 'custom' && (
        <>
          <FieldLabel d={d} text="More info (optional)" />
          <Text style={[styles.fieldHint, { color: d.textMuted }]}>
            Help us find the other dates — e.g. "every home gameday", "whenever it rains"
          </Text>
          <TextInput
            style={[styles.textArea, { color: d.text, backgroundColor: d.cardBackground, borderColor: d.border }]}
            value={notes} onChangeText={setNotes}
            placeholder="Ex: every home gameday, whenever it rains, random"
            placeholderTextColor={d.textHint}
            multiline numberOfLines={3} textAlignVertical="top"
          />
        </>
      )}

      {/* Weekly — multi-day picker */}
      {recurrenceType === 'weekly' && (
        <>
          <FieldLabel d={d} text="Day(s) of the week *" />
          <DayPicker selected={selectedDays} onToggle={toggleDay} d={d} />
        </>
      )}

      {/* Biweekly — single day picker */}
      {recurrenceType === 'biweekly' && (
        <>
          <FieldLabel d={d} text="Which day? *" />
          <SingleDayPicker selected={selectedDay} onSelect={setSelectedDay} d={d} />
        </>
      )}

      {/* Monthly — day of month */}
      {recurrenceType === 'monthly' && (
        <>
          <FieldLabel d={d} text="Day of month (1–28) *" />
          <TextInput
            style={[styles.textInput, { color: d.text, backgroundColor: d.cardBackground, borderColor: d.border }]}
            value={dayOfMonth} onChangeText={(v) => setDayOfMonth(v.replace(/\D/g, ''))}
            placeholder="e.g. 15"
            placeholderTextColor={d.textHint}
            keyboardType="number-pad"
            maxLength={2}
          />
        </>
      )}

      {/* Time range — shown once recurrence is selected */}
      {recurrenceType && (
        <>
          <FieldLabel d={d} text="Time range *" />
          <View style={styles.timeRangeRow}>
            <TimePicker
              label="Start" hour={startHour} minute={startMin} isAm={startAm}
              onHour={setStartHour} onMin={setStartMin} onToggleAmPm={() => setStartAm((a) => !a)} d={d}
            />
            <Text style={[styles.timeRangeDash, { color: d.textMuted }]}>—</Text>
            <TimePicker
              label="End (opt.)" hour={endHour} minute={endMin} isAm={endAm}
              onHour={setEndHour} onMin={setEndMin} onToggleAmPm={() => setEndAm((a) => !a)} d={d}
            />
          </View>
        </>
      )}

      <FieldLabel d={d} text="Details" />
      <TextInput
        style={[styles.textArea, { color: d.text, backgroundColor: d.cardBackground, borderColor: d.border }]}
        value={description} onChangeText={setDescription}
        placeholder="Any extra info — cover charge, theme, etc."
        placeholderTextColor={d.textHint}
        multiline numberOfLines={3} textAlignVertical="top"
      />

      {(error || submitError) ? <Text style={[styles.errorText, { color: d.error }]}>{error || submitError}</Text> : null}

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: '#a78bfa' }, submitting && { opacity: 0.7 }]}
        onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}
      >
        {submitting ? <ActivityIndicator color="#fff" /> :
          <Text style={[styles.btnText, { color: '#fff' }]}>
            {REWARDS_ENABLED ? `Submit — Earn ${POINTS_CONFIG.new_event} pts` : 'Submit Event'}
          </Text>}
      </TouchableOpacity>
    </View>
  );
};

/* ── Styles ── */

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  optionContent: { paddingHorizontal: 16, paddingTop: 60 },
  formContent: { paddingHorizontal: 16, paddingTop: 56 },

  /* Auth wall / success */
  wallTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, marginTop: 20, marginBottom: 8, textAlign: 'center' },
  wallSub: { fontSize: 14, fontWeight: '500', textAlign: 'center', marginBottom: 4 },
  successCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  successTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginTop: 8, marginBottom: 4 },
  mutedText: { fontSize: 13, fontWeight: '500' },
  linkText: { fontSize: 14, fontWeight: '600' },
  ptsBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, marginTop: 12, borderWidth: 1 },
  ptsBadgeText: { fontWeight: '700', fontSize: 14 },

  /* Progress card */
  progressCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 28 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progressLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressPts: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  progressLabel: { fontSize: 13, fontWeight: '500' },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 4 },
  progressHint: { fontSize: 12, fontWeight: '500' },

  /* Option list */
  prompt: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, marginBottom: 16 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: 1,
    padding: 18, marginBottom: 12, gap: 12,
  },
  optionBody: { flex: 1, gap: 4 },
  optionLabel: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  optionDesc: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  optionRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ptsPill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  ptsPillText: { fontSize: 12, fontWeight: '700' },

  /* Form header */
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backBtnText: { fontSize: 14, fontWeight: '500' },
  formTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginBottom: 24 },

  /* Form fields */
  formGap: { gap: 14 },
  fieldLabel: { fontSize: 15, fontWeight: '700', letterSpacing: -0.1 },
  fieldHint: { fontSize: 12, fontWeight: '500', marginTop: -8, lineHeight: 18 },
  errorText: { fontSize: 13, fontWeight: '500', textAlign: 'center' },

  textInput: {
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15,
  },
  textArea: {
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, minHeight: 90,
  },

  /* Venue selector */
  selectorBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 14, gap: 8,
  },
  selectorBtnText: { fontSize: 15 },
  dateDoneBtn: { alignSelf: 'flex-end', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  dateDoneText: { fontSize: 14, fontWeight: '700' },
  selectorList: {
    borderRadius: 12, borderWidth: 1.5,
    marginTop: 4, overflow: 'hidden',
  },
  selectorItem: { paddingHorizontal: 14, paddingVertical: 12 },
  selectorItemName: { fontSize: 15, fontWeight: '500' },
  selectorItemSub: { fontSize: 12, fontWeight: '400', marginTop: 2 },

  /* Day picker */
  dayRow: { flexDirection: 'row', gap: 6 },
  dayPill: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  dayPillText: { fontSize: 12, fontWeight: '700' },
  recurrencePill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },

  /* Bool (all day) */
  boolRow: { flexDirection: 'row', gap: 10 },
  boolBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12 },
  boolBtnText: { fontSize: 15, fontWeight: '700' },

  /* Time range */
  timeRangeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  timeRangeDash: { fontSize: 18, fontWeight: '300', paddingBottom: 12 },
  timeCol: { flex: 1, gap: 6 },
  timeColLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeBox: { width: 42, height: 44, borderRadius: 10, borderWidth: 1, fontSize: 17, fontWeight: '600' },
  timeColon: { fontSize: 18, fontWeight: '300', marginHorizontal: 2 },
  ampmBtn: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 12 },
  ampmText: { fontSize: 13, fontWeight: '700' },

  /* Price */
  priceRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  priceDollar: { fontSize: 18, fontWeight: '600', marginRight: 4 },
  priceInput: { flex: 1, fontSize: 18, fontWeight: '600', paddingVertical: 14 },

  /* Deal list (deal issue step 3) */
  dealList: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  dealRow: { paddingHorizontal: 14, paddingVertical: 12 },
  dealRowTitle: { fontSize: 15, fontWeight: '600' },
  dealRowSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  emptyNote: { fontSize: 13, fontWeight: '500', fontStyle: 'italic' },

  /* Issue options */
  issueBtn: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  issueBtnText: { fontSize: 15, fontWeight: '500' },

  /* Bar info reference card */
  barInfoCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 4 },
  barInfoName: { fontSize: 15, fontWeight: '700' },
  barInfoLine: { fontSize: 13, fontWeight: '400' },

  /* Location button */
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
  locationBtnText: { fontSize: 14, fontWeight: '600' },

  /* Submit button */
  btn: { borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '700' },
});
