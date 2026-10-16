#!/usr/local/perl-cbt/bin/perl
use Modern::Perl;
use Carp;
use Data::Dumper;
use HTTP::Request;
use JSON;
use LWP::UserAgent;
use MIME::Base64 qw/encode_base64/;

my $BASE_URL      = 'https://app.asana.com/api/1.0';
my $ASANA_API_KEY = 'ASANA_PERSONAL_TOKEN';
my $ua            = LWP::UserAgent->new();

open my $input_wekan, '<', 'template.json';
my $wekan_json = readline($input_wekan);
close $input_wekan;
my $wekan_board = decode_json($wekan_json);
my %users;
my %users_by_gid;
# get user IDs from template board
foreach my $user ( @{ $wekan_board->{users} } ) {
   $users{ $user->{profile}->{fullname} } = $user->{_id};
}
# get list IDs from template (we ended up not using these)
my %lists;
foreach my $list ( @{ $wekan_board->{lists} } ) {
   $lists{ $list->{title} } = $list->{_id};
}

my @headers;
push @headers, ( 'Accept',        'application/json' );
push @headers, ( 'Authorization', "Bearer $ASANA_API_KEY" );
my $projects_req = HTTP::Request->new( "GET", "$BASE_URL/projects", \@headers, );
my $projects_res = $ua->request($projects_req);
my $projects     = decode_json( $projects_res->content )->{data};
foreach my $project (@$projects) {
   say "Project: ".$project->{name};
   my $tasks_url =
         '/tasks?project='
       . $project->{gid}
       . '&opt_fields=completed,name,notes,assignee,created_by,memberships.project.name, memberships.section.name,due_on,created_at,custom_fields';
   my $tasks_req = HTTP::Request->new( 'GET', "$BASE_URL$tasks_url", \@headers );
   my $tasks_res = $ua->request($tasks_req);
   my @output_tasks;
   my $tasks = decode_json( $tasks_res->content )->{data};
   foreach my $task (@$tasks) {
      next if $task->{completed};
      say '   - '.$task->{name};
      my $git_branch;
      my $prio;
      foreach my $custom ( @{ $task->{custom_fields} } ) {
         if ( $custom->{name} eq 'git branch' ) {
            $git_branch = $custom->{text_value};
            next;
         }
         # We ended up not importing these.
         if ( $custom->{name} eq 'Priority' && defined $custom->{display_value} ) {
            $prio =
                  $custom->{display_value} eq 'High' ? 'fwccC9'   
                : $custom->{display_value} eq 'Med'  ? 'yPnaFa'
                : $custom->{display_value} eq 'Low'  ? 'W4vMvm'
                :                                      'ML5drH';
            next;
         }
      }
      if ( !defined $users_by_gid{ $task->{created_by}->{gid} } ) {
         my $user_req =
             HTTP::Request->new( 'GET', "$BASE_URL/users/" . $task->{created_by}->{gid},
            \@headers );
         my $user_res = $ua->request($user_req);
         my $user     = decode_json( $user_res->content )->{data};
         if ( defined $users{ $user->{name} } ) {
            $users_by_gid{ $task->{created_by}->{gid} } = $users{ $user->{name} };
         }
      }
      my $creator = $users_by_gid{ $task->{created_by}->{gid} } // undef;
      if ( defined $task->{assignee} && !defined $users_by_gid{ $task->{assignee}->{gid} } ) {
         my $user_req =
             HTTP::Request->new( 'GET', "$BASE_URL/users/" . $task->{assignee}->{gid},
            \@headers );
         my $user_res = $ua->request($user_req);
         my $user     = decode_json( $user_res->content )->{data};
         if ( defined $users{ $user->{name} } ) {
            $users_by_gid{ $task->{assignee}->{gid} } = $users{ $user->{name} };
         }
      }
      my $assignee = defined $task->{assignee} ? $users_by_gid{ $task->{assignee}->{gid} } : undef;
      my $list;
      foreach my $membership ( @{ $task->{memberships} } ) {
         next if $membership->{project}->{name} ne $project->{name};
         $list = $membership->{section}->{name};
      }

      # I was trying to create JSON that I could use on the import screen in Wekan,
      # but for bigger boards, it was just *too* hefty, so I took that JSON and used 
      # APIs to import.
      my %output_task = (
         swimlaneId   => 'As4SNerx4Y4mMnJ8n',   # 'Bugs'  
         sort         => 0,
         type         => 'cardType-card',
         archived     => JSON::false,
         title        => $task->{name},
         description  => $task->{notes},
         createdAt    => $task->{created_at},
         dueAt        => defined $task->{due_on} ? $task->{due_on} . 'T22:00:00.000Z' : undef,
         customFields => [
            {
               _id   => 'rL8BpFHp5xxSFbDdr',
               value => $git_branch,
            },
         ],
         labelIds  => [$prio],
         listId    => $list,
         userId    => $creator,
         assignees => [$assignee],
      );
      my @final_comments;
      my $comments_req =
          HTTP::Request->new( 'GET', "$BASE_URL/tasks/" . $task->{gid} . '/stories',
         \@headers );
      my $comments_res = $ua->request($comments_req);
      my $comments     = decode_json( $comments_res->content )->{data};
      foreach my $comment (@$comments) {
         next if $comment->{type} ne 'comment';
         if ( !defined $users_by_gid{ $comment->{created_by}->{gid} } ) {
            my $user_req =
                HTTP::Request->new( 'GET', "$BASE_URL/users/" . $comment->{created_by}->{gid},
               \@headers );
            my $user_res = $ua->request($user_req);
            my $user     = decode_json( $user_res->content )->{data};
            if ( defined $users{ $user->{name} } ) {
               $users_by_gid{ $comment->{created_bye}->{gid} } = $users{ $user->{name} };
            }
         }
         my $commentor    = $users_by_gid{ $comment->{created_by}->{gid} };
         my %this_comment = (
            text      => $comment->{text},
            createdAt => $comment->{created_at},
            userId    => $commentor,
         );
         push @final_comments, \%this_comment;
      }
      $output_task{comments} = \@final_comments;


      my @final_attachments;
      my $attachments_req =
          HTTP::Request->new( 'GET', "$BASE_URL/tasks/" . $task->{gid} . '/attachments',
         \@headers );
      my $attachments_res = $ua->request($attachments_req);
      my $attachments     = decode_json( $attachments_res->content )->{data};
      foreach my $attachment (@$attachments) {
         my $att_req =
             HTTP::Request->new( 'GET', "$BASE_URL/attachments/" . $attachment->{gid},
            \@headers );
         my $att_res = $ua->request($att_req);
         my $att     = decode_json( $att_res->content )->{data};
         my $file_req=HTTP::Request->new('GET',$att->{download_url});
         my $file_res=$ua->request($file_req);
         my $file=encode_base64($file_res->content);

           my %this_attachment = (
              file => $file,
              name => $att->{name},
              createdAt => $att->{created_at},
           );
           push @final_attachments, \%this_attachment;

      }
      $output_task{attachments} = \@final_attachments;
      push @output_tasks, \%output_task;
   }
   my $file_name = $project->{name};
   $file_name =~ s/\//_/g;
   open my $output_file, '>',$file_name.'_exported.json';
   print $output_file encode_json(\@output_tasks);
   close $output_file;
}