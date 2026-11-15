import unittest
from server import validate, parse_horizons

class HorizonsTests(unittest.TestCase):
    def test_validation(self):
        for lat, lon, start, days in [(91,0,'2026-11-15',7),(0,181,'2026-11-15',7),('nan',0,'2026-11-15',7),(0,0,'2026-02-30',7),(0,0,'2026-11-15',365),(0,0,'1999-01-01',7)]:
            with self.assertRaises(ValueError): validate(lat,lon,start,days)

    def test_parser_ignores_observer_flags(self):
        data={'result':'Header\n$$SOE\n2461359.500000000,*,i,114.442858,1.349506,\n2461359.541666667, , ,113.935287,1.353515,\n$$EOE\nFooter'}
        rows=parse_horizons(data)
        self.assertEqual(rows[0]['az'],114.442858)
        self.assertEqual(rows[0]['el'],1.349506)
        self.assertEqual(rows[1]['time']-rows[0]['time'],3600000)

    def test_bad_upstream_data_is_not_accepted(self):
        for data in [{'error':'failure'},{'result':'no ephemeris'},{'result':'$$SOE\n1, , ,nan,2,\n2, , ,4,5,\n$$EOE'}]:
            with self.assertRaises(ValueError): parse_horizons(data)

if __name__=='__main__': unittest.main()
