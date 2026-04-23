#!/usr/local/perl-cbt/bin/perl
use Modern::Perl;
use Carp;
use Data::Dumper;
use HTTP::Request;
use JSON;
use LWP::UserAgent;
use MIME::Base64 qw/decode_base64/;
use Try::Tiny;

my $BASE_URL = 'https://taskboard.example.com/api';
my $TOKEN    = 'MY_TOKEN';
my $me       = 'MY_USER_ID';
my $ua       = LWP::UserAgent->new();

my @headers;
push @headers, ( 'Accept',        'application/json' );
push @headers, ( 'Authorization', "Bearer $TOKEN" );

my @form_headers;
push @form_headers, ( 'Content-Type',  'application/json' );
push @form_headers, ( 'Accept',        'application/json' );
push @form_headers, ( 'Authorization', "Bearer $TOKEN" );

# Prior to running this, I built all the boards, with labels and lists and swimlanes.
# Grabbed the IDs for the boards for each project, and put them here to match up with
# filenames from the Asana export script.

my %board_to_use = (
   Project_1        => 'F5ZiCXnf4d7qNBRjp',
   Project_2        => 'Shw3tyfC2JWCutBLj',
);

opendir my $files_dir, '.'
    or croak "Cannot open input directory: $!";
my @files = readdir $files_dir;
closedir $files_dir;

foreach my $tasks_file (@files) {
   next if $tasks_file !~ /_exported.json/;
   my $project = $tasks_file;
   $project =~ s/_exported.json//;
   say "Project - $project";
   my $board;
   if ( $board_to_use{$project} ) {
      $board = $board_to_use{$project};
   }
   say '   No board!' if !$board;
   next               if !$board;
   my $labels_req = HTTP::Request->new( 'GET', "$BASE_URL/boards/$board", \@headers );
   my $labels_res = $ua->request($labels_req);
   my $board_data = decode_json( $labels_res->content);
   my $labels = $board_data->{labels};
   my $label_to_use;
   # We're merging several Asana boards onto one Wekan board, with labels per project.
   foreach my $label (@$labels) {
       $label_to_use = $label->{_id} if $label->{name} eq $project;
   }

   my $lanes_req = HTTP::Request->new( 'GET', "$BASE_URL/boards/$board/swimlanes", \@headers );
   my $lanes_res = $ua->request($lanes_req);
   my $lanes     = decode_json( $lanes_res->content );
   my $lane_to_use;
   foreach my $lane (@$lanes) {
      # Our Asana didn't use swimlanes; all of our Wekan boards have a "Bugs" lane, so use that.
      $lane_to_use = $lane->{_id} if $lane->{title} eq 'Bugs';
   }

   my $lists_req = HTTP::Request->new( 'GET', "$BASE_URL/boards/$board/lists", \@headers );
   my $lists_res = $ua->request($lists_req);
   my $lists     = decode_json( $lists_res->content );
   my %list_to_use;
   foreach my $list (@$lists) {
      $list_to_use{ $list->{title} } = $list->{_id};
   }

   open my $task_export_file, '<', $tasks_file;
   my $tasks_json = readline($task_export_file);
   close $task_export_file;
   my $tasks = decode_json($tasks_json);
   foreach my $task (@$tasks) {
      say '   - ' . $task->{title};
      my %body_info = (
         swimlaneId  => $lane_to_use,
         authorId    => $task->{userId},
         assignees   => $task->{assignees},
         title       => $task->{title},
         description => $task->{description},
      );
      my $body     = encode_json( \%body_info );
      my $list     = $list_to_use{ $task->{listId} } // $list_to_use{'Backlog'};
      my $task_req = HTTP::Request->new( 'POST', "$BASE_URL/boards/$board/lists/$list/cards",
         \@form_headers, $body );
      my $task_res = $ua->request($task_req);
      my $res;
      try {
       $res      = decode_json( $task_res->content );
      } catch {
         # Did these manually afterward.
          say "--->UNABLE TO LOAD TASK";
          next;
      };
      my $card     = $res->{_id};

      if ($label_to_use) {
          my $card_edit_body = encode_json( { labelIds => [ $label_to_use ]});
          my $card_edit_req = HTTP::Request->new( 'PUT', "$BASE_URL/boards/$board/lists/$list/cards/$card",
         \@form_headers, $card_edit_body );
         my $card_edit_res = $ua->request($card_edit_req);
      }

      foreach my $comment ( @{ $task->{comments} } ) {
         my $comment_body =
             encode_json( { authorId => $comment->{userId}, comment => $comment->{text} } );
         my $comment_req =
             HTTP::Request->new( 'POST', "$BASE_URL/boards/$board/cards/$card/comments",
            \@form_headers, $comment_body );
         my $comment_res = $ua->request($comment_req);
      }
   }
}

