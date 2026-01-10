"""
Management command to update gender field for existing members based on their first names.
Run with: python manage.py update_gender_from_names
"""
from django.core.management.base import BaseCommand
from members.models import Member


class Command(BaseCommand):
    help = 'Updates gender field for members based on common German first names'

    # Common German male and female first names
    MALE_NAMES = {
        'alexander', 'andreas', 'bernd', 'christian', 'daniel', 'david', 'dennis',
        'dirk', 'fabian', 'felix', 'florian', 'frank', 'jan', 'jens', 'jonas',
        'jörg', 'jürgen', 'kai', 'kevin', 'klaus', 'lars', 'lukas', 'manuel',
        'marcel', 'marco', 'marcus', 'mario', 'markus', 'martin', 'matthias',
        'max', 'michael', 'mike', 'nico', 'oliver', 'patrick', 'paul', 'peter',
        'philipp', 'ralf', 'rene', 'robert', 'sascha', 'sebastian', 'stefan',
        'steffen', 'sven', 'thomas', 'tim', 'tobias', 'tom', 'torsten', 'uwe',
        'walter', 'wolfgang', 'milan', 'leon', 'dave', 'emil', 'noah', 'luca',
        'elias', 'finn', 'luis', 'ben', 'jonas', 'paul', 'oskar',
    }

    FEMALE_NAMES = {
        'alexandra', 'andrea', 'angela', 'angelika', 'anja', 'anna', 'annika',
        'barbara', 'bianca', 'birgit', 'britta', 'carmen', 'caroline', 'cathrin',
        'christina', 'christine', 'claudia', 'daniela', 'diana', 'doreen', 'elena',
        'elisabeth', 'emma', 'eva', 'franziska', 'gabriele', 'gisela', 'hannah',
        'heike', 'ines', 'ingrid', 'iris', 'isabel', 'jacqueline', 'jana',
        'jasmin', 'jennifer', 'jessica', 'johanna', 'julia', 'jutta', 'karin',
        'katharina', 'katja', 'katrin', 'kerstin', 'kirsten', 'klara', 'lara',
        'larissa', 'laura', 'lea', 'lena', 'linda', 'lisa', 'mandy', 'manuela',
        'maria', 'marie', 'marina', 'marion', 'martina', 'melanie', 'michelle',
        'mia', 'michaela', 'monika', 'nadine', 'natalie', 'nicole', 'nina',
        'petra', 'ramona', 'regina', 'sabine', 'sandra', 'sara', 'sarah',
        'silke', 'simone', 'sophia', 'stefanie', 'susanne', 'svenja', 'tanja',
        'tatjana', 'theresa', 'ulrike', 'ursula', 'vanessa', 'vera', 'verena',
        'yvonne', 'dorothea', 'lilli', 'dayana', 'mia', 'emilia', 'sophia',
        'lina', 'amelie', 'clara', 'nele',
    }

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without actually changing it',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Update even if gender is already set',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force = options['force']

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be saved'))

        # Get members with empty gender or all if force
        if force:
            members = Member.objects.all()
            self.stdout.write(f'Processing all {members.count()} members (force mode)...')
        else:
            members = Member.objects.filter(gender='')
            self.stdout.write(f'Processing {members.count()} members with empty gender...')

        updated_male = 0
        updated_female = 0
        skipped = 0
        unknown = 0

        for member in members:
            first_name_lower = member.first_name.lower().strip()
            
            # Determine gender from name
            new_gender = None
            if first_name_lower in self.MALE_NAMES:
                new_gender = 'male'
            elif first_name_lower in self.FEMALE_NAMES:
                new_gender = 'female'
            
            if new_gender:
                if not dry_run:
                    member.gender = new_gender
                    member.save()
                
                if new_gender == 'male':
                    updated_male += 1
                    self.stdout.write(f'  ✓ {member.first_name} {member.last_name} → male')
                else:
                    updated_female += 1
                    self.stdout.write(f'  ✓ {member.first_name} {member.last_name} → female')
            else:
                unknown += 1
                self.stdout.write(
                    self.style.WARNING(f'  ? {member.first_name} {member.last_name} - unknown name')
                )

        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS(f'Updated to male: {updated_male}'))
        self.stdout.write(self.style.SUCCESS(f'Updated to female: {updated_female}'))
        self.stdout.write(self.style.WARNING(f'Unknown names: {unknown}'))
        
        if dry_run:
            self.stdout.write(self.style.WARNING('\nDRY RUN - No changes were saved'))
            self.stdout.write('Run without --dry-run to apply changes')
        else:
            self.stdout.write(self.style.SUCCESS(f'\n✓ Successfully updated {updated_male + updated_female} members'))
